from odoo import api, fields, models
from odoo.exceptions import UserError


class MfgIncomingCheck(models.Model):
    _name = "mfg.incoming.check"
    _description = "Inward Quality Inspection (Goods Receipt)"
    _order = "picking_id desc"

    name = fields.Char(compute="_compute_name", store=True)
    picking_id = fields.Many2one(
        "stock.picking", required=True, ondelete="cascade", index=True)
    partner_id = fields.Many2one(related="picking_id.partner_id", store=True)
    state = fields.Selection(
        [("pending", "Pending"), ("pass", "Accepted"), ("fail", "Rejected")],
        default="pending", required=True, index=True)
    note = fields.Char("Inspector Notes")
    checked_by = fields.Many2one("res.users")
    checked_on = fields.Datetime()

    @api.depends("picking_id.name")
    def _compute_name(self):
        for rec in self:
            rec.name = "Inward QC / %s" % (rec.picking_id.name or "?")


class StockPicking(models.Model):
    _inherit = "stock.picking"

    inward_check_ids = fields.One2many("mfg.incoming.check", "picking_id")
    inward_qc_passed = fields.Boolean(compute="_compute_inward_qc_passed")

    def _compute_inward_qc_passed(self):
        # An incoming receipt is cleared only when it has been inspected and
        # accepted (no pending check, at least one pass). Non-incoming pickings
        # are never gated.
        for p in self:
            if p.picking_type_id.code != "incoming":
                p.inward_qc_passed = True
                continue
            checks = p.inward_check_ids
            p.inward_qc_passed = (
                bool(checks)
                and not any(c.state == "pending" for c in checks)
                and any(c.state == "pass" for c in checks)
            )

    def _ensure_inward_check(self):
        Check = self.env["mfg.incoming.check"]
        for p in self:
            if p.picking_type_id.code == "incoming" and not p.inward_check_ids:
                Check.create({"picking_id": p.id})

    def action_set_inward_result(self, result, note=False):
        """Record the inward inspection outcome from the portal. A rejection
        re-opens the gate as a fresh pending check (same pattern as the
        manufacturing QA gates) so the lot must be re-inspected after the
        vendor reworks or redelivers."""
        for p in self:
            p._ensure_inward_check()
            check = (p.inward_check_ids.filtered(lambda c: c.state == "pending")[:1]
                     or p.inward_check_ids[:1])
            check.write({
                "state": result,
                "note": note or check.note,
                "checked_by": self.env.uid,
                "checked_on": fields.Datetime.now(),
            })
            if result == "fail":
                check.copy({"state": "pending", "note": False,
                            "checked_by": False, "checked_on": False})
        return True

    def action_receive_to_store(self):
        """Post the Goods Receipt into the store — only if inward QC accepted.
        Sets received quantities to the demand so validation completes cleanly."""
        self.ensure_one()
        if not self.inward_qc_passed:
            raise UserError(
                "Inward quality inspection is mandatory: %s cannot be received "
                "into the store until the incoming lot has been inspected and "
                "Accepted." % self.name)
        for move in self.move_ids:
            if move.state not in ("done", "cancel"):
                move.quantity = move.product_uom_qty
                move.picked = True
        return self.button_validate()

    def button_validate(self):
        for p in self:
            if p.picking_type_id.code == "incoming" and not p.inward_qc_passed:
                raise UserError(
                    "Inward quality inspection is mandatory: %s cannot be "
                    "received into the store until the incoming lot has been "
                    "inspected and Accepted." % p.name)
        return super().button_validate()
