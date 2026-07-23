from odoo import api, fields, models

DISPOSITIONS = [
    ("pending", "Awaiting review"),
    ("rework", "Rework"),
    ("scrap", "Scrap"),
    ("use_as_is", "Use as is"),
    ("return_vendor", "Return to vendor"),
]


class MfgNcr(models.Model):
    """Nonconformance Report — raised automatically when a quality gate fails
    (ISO 9001 Clause 8.7, control of nonconforming output) and carried through
    disposition + corrective action (Clause 10.2)."""
    _name = "mfg.ncr"
    _description = "Nonconformance Report"
    _order = "create_date desc"

    name = fields.Char(compute="_compute_name", store=True)
    production_id = fields.Many2one("mrp.production", ondelete="cascade", index=True)
    product_id = fields.Many2one(related="production_id.product_id", store=True)
    check_id = fields.Many2one("mfg.quality.check", ondelete="set null")
    checkpoint = fields.Selection(
        [("in_process", "In-Process Check"), ("final", "Finished-Goods Check")])
    reason = fields.Char("Defect / reason")
    disposition = fields.Selection(DISPOSITIONS, default="pending", required=True, index=True)
    root_cause = fields.Text("Root cause")
    corrective_action = fields.Text("Corrective / preventive action")
    state = fields.Selection([("open", "Open"), ("closed", "Closed")], default="open", index=True)
    raised_by = fields.Many2one("res.users", default=lambda self: self.env.user)
    closed_by = fields.Many2one("res.users")
    closed_on = fields.Datetime()

    @api.depends("production_id.name")
    def _compute_name(self):
        for r in self:
            r.name = "NCR / %s" % (r.production_id.name or "?")

    def action_set_disposition(self, disposition, root_cause=False, corrective_action=False):
        for r in self:
            vals = {"disposition": disposition}
            if root_cause is not False:
                vals["root_cause"] = root_cause
            if corrective_action is not False:
                vals["corrective_action"] = corrective_action
            r.write(vals)
        return True

    def action_close(self):
        self.write({
            "state": "closed",
            "closed_by": self.env.uid,
            "closed_on": fields.Datetime.now(),
        })
        return True
