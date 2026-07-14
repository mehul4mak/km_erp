from odoo import api, fields, models
from odoo.exceptions import UserError


CHECKPOINTS = [
    ("in_process", "In-Process Check"),
    ("final", "Finished-Goods Check"),
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

    def action_set_result(self, result, note=False):
        """Record a pass/fail from the portal. Failing re-opens the gate as a
        new pending check so the batch must be re-inspected after rework."""
        for rec in self:
            rec.write({
                "state": result,
                "note": note or rec.note,
                "checked_by": self.env.uid,
                "checked_on": fields.Datetime.now(),
            })
            if result == "fail":
                rec.copy({"state": "pending", "note": False,
                          "checked_by": False, "checked_on": False})
        return True


class MrpProduction(models.Model):
    _inherit = "mrp.production"

    quality_check_ids = fields.One2many("mfg.quality.check", "production_id")
    qa_gates_passed = fields.Boolean(compute="_compute_qa_gates_passed")

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
            if not mo.qa_gates_passed:
                raise UserError(
                    "Quality gates are mandatory: %s cannot be closed until the "
                    "In-Process and Finished-Goods checks have both passed."
                    % mo.name)
        return super().button_mark_done()
