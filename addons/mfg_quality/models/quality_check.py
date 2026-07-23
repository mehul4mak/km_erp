from odoo import api, fields, models
from odoo.exceptions import UserError


CHECKPOINTS = [
    ("in_process", "In-Process Check"),
    ("final", "Finished-Goods Check"),
]

# The floor lifecycle layered over Odoo's own state, so a job's physical stage
# is explicit and the QA gates can be tied to it.
KM_STAGES = [
    ("planned", "Planned"),
    ("started", "Started"),
    ("in_progress", "In Progress"),
    ("finished", "Finished"),
    ("done", "Done"),
]


class MfgQualityCheck(models.Model):
    _name = "mfg.quality.check"
    _description = "Production Quality Gate"
    _order = "production_id desc, checkpoint"

    name = fields.Char(compute="_compute_name", store=True)
    production_id = fields.Many2one(
        "mrp.production", required=True, ondelete="cascade", index=True)
    product_id = fields.Many2one(related="production_id.product_id", store=True)
    checkpoint = fields.Selection(CHECKPOINTS, required=True, default="in_process")
    state = fields.Selection(
        [("pending", "Pending"), ("pass", "Passed"), ("fail", "Failed")],
        default="pending", required=True, index=True)
    note = fields.Char("Inspector Notes")
    checked_by = fields.Many2one("res.users")
    checked_on = fields.Datetime()

    @api.depends("production_id.name", "checkpoint")
    def _compute_name(self):
        labels = dict(CHECKPOINTS)
        for rec in self:
            rec.name = "%s / %s" % (
                rec.production_id.name or "?", labels.get(rec.checkpoint, ""))

    due = fields.Boolean(compute="_compute_due")

    def _compute_due(self):
        # A check is actionable only at the matching lifecycle stage.
        for rec in self:
            stage = rec.production_id.km_stage
            rec.due = rec.state == "pending" and (
                (rec.checkpoint == "in_process" and stage == "in_progress")
                or (rec.checkpoint == "final" and stage == "finished")
            )

    def action_set_result(self, result, note=False):
        """Record a pass/fail from the portal. Failing re-opens the gate as a
        new pending check so the batch must be re-inspected after rework.
        A check can only be actioned at its matching stage: the In-Process
        check while the job is In Progress, the Finished-Goods check when it
        is Finished."""
        for rec in self:
            stage = rec.production_id.km_stage
            if rec.checkpoint == "in_process" and stage != "in_progress":
                raise UserError(
                    "The In-Process check applies while the job is In Progress — "
                    "start production on %s first." % rec.production_id.name)
            if rec.checkpoint == "final" and stage != "finished":
                raise UserError(
                    "The Finished-Goods check applies once the job is Finished — "
                    "finish production on %s first." % rec.production_id.name)
            rec.write({
                "state": result,
                "note": note or rec.note,
                "checked_by": self.env.uid,
                "checked_on": fields.Datetime.now(),
            })
            if result == "fail":
                rec.copy({"state": "pending", "note": False,
                          "checked_by": False, "checked_on": False})
                # ISO 8.7: a failure raises a Nonconformance Report for disposition.
                self.env["mfg.ncr"].create({
                    "production_id": rec.production_id.id,
                    "check_id": rec.id,
                    "checkpoint": rec.checkpoint,
                    "reason": note or "Quality gate failed",
                })
        return True


class MrpProduction(models.Model):
    _inherit = "mrp.production"

    quality_check_ids = fields.One2many("mfg.quality.check", "production_id")
    qa_gates_passed = fields.Boolean(compute="_compute_qa_gates_passed")
    km_stage = fields.Selection(
        KM_STAGES, string="Floor Stage", default="planned", index=True, copy=False,
        help="Physical progress of the job on the floor, from Planned to Done.")
    km_lot = fields.Char("Batch / Lot No.", copy=False, readonly=True,
        help="Traceability lot assigned to the finished batch when the job closes.")
    ncr_ids = fields.One2many("mfg.ncr", "production_id")

    def _checkpoint_passed(self, checkpoint):
        """A checkpoint is cleared when it has no pending check and a recorded
        pass (a failure re-opens a fresh pending one)."""
        self.ensure_one()
        cs = self.quality_check_ids.filtered(lambda c: c.checkpoint == checkpoint)
        return bool(cs) and not any(c.state == "pending" for c in cs) and any(
            c.state == "pass" for c in cs)

    def action_km_start(self):
        """Planned -> Started: reserve/issue the components and open the job."""
        for mo in self:
            if mo.km_stage != "planned":
                raise UserError("%s has already been started." % mo.name)
            try:
                mo.action_assign()  # reserve components from stock
            except Exception:
                pass
            mo.km_stage = "started"
        return True

    def action_km_progress(self):
        """Started -> In Progress: production is now running; the In-Process
        check becomes due."""
        for mo in self:
            if mo.km_stage != "started":
                raise UserError("%s must be Started before it can go In Progress." % mo.name)
            mo.km_stage = "in_progress"
        return True

    def action_km_finish(self):
        """In Progress -> Finished: only once the In-Process check has passed;
        the Finished-Goods check then becomes due before the job can close."""
        for mo in self:
            if mo.km_stage != "in_progress":
                raise UserError("%s must be In Progress before it can be finished." % mo.name)
            if not mo._checkpoint_passed("in_process"):
                raise UserError(
                    "The In-Process check must pass before you can finish %s." % mo.name)
            mo.km_stage = "finished"
        return True

    def _compute_qa_gates_passed(self):
        # A failed check spawns a fresh pending one, so the gate is open only
        # when nothing is pending and both checkpoints have a recorded pass.
        for mo in self:
            checks = mo.quality_check_ids
            mo.qa_gates_passed = (
                bool(checks)
                and not any(c.state == "pending" for c in checks)
                and all(
                    any(c.state == "pass" for c in checks if c.checkpoint == cp)
                    for cp in ("in_process", "final")
                )
            )

    def _ensure_quality_checks(self):
        Check = self.env["mfg.quality.check"]
        for mo in self:
            existing = set(mo.quality_check_ids.mapped("checkpoint"))
            for cp, _label in CHECKPOINTS:
                if cp not in existing:
                    Check.create({"production_id": mo.id, "checkpoint": cp})

    def action_confirm(self):
        res = super().action_confirm()
        self._ensure_quality_checks()
        return res

    def button_mark_done(self):
        for mo in self:
            if mo.km_stage not in ("finished", "done"):
                raise UserError(
                    "%s must be Finished before it can be closed." % mo.name)
            if not mo.qa_gates_passed:
                raise UserError(
                    "Quality gates are mandatory: %s cannot be closed until the "
                    "In-Process and Finished-Goods checks have both passed."
                    % mo.name)
        res = super().button_mark_done()
        for mo in self:
            vals = {"km_stage": "done"}
            if not mo.km_lot:
                vals["km_lot"] = "LOT-%s-%s" % (
                    (mo.name or "").replace("/", ""),
                    fields.Date.today().strftime("%y%m%d"))
            mo.write(vals)
        return res
