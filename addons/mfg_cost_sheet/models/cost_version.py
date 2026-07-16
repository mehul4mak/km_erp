from odoo import api, fields, models


class MfgCostSheetVersion(models.Model):
    """An immutable snapshot of a BOM's cost sheet at a point in time, so a
    change in material rates, sizes or margins is captured with who/when/why."""
    _name = "mfg.cost.sheet.version"
    _description = "Cost Sheet Version"
    _order = "create_date desc"

    name = fields.Char(required=True)
    bom_id = fields.Many2one(
        "mrp.bom", required=True, ondelete="cascade", index=True)
    product_tmpl_id = fields.Many2one(
        related="bom_id.product_tmpl_id", store=True)
    material_cost = fields.Float(digits="Product Price")
    operation_cost = fields.Float(digits="Product Price")
    subtotal = fields.Float(digits="Product Price")
    rejection_pct = fields.Float()
    profit_pct = fields.Float()
    suggested_price = fields.Float(digits="Product Price")
    note = fields.Char("Reason for change")
    saved_by = fields.Many2one(
        "res.users", default=lambda self: self.env.user)


class MrpBomVersioning(models.Model):
    _inherit = "mrp.bom"

    cs_version_ids = fields.One2many("mfg.cost.sheet.version", "bom_id")
    cs_version_count = fields.Integer(compute="_compute_cs_version_count")

    def _compute_cs_version_count(self):
        for bom in self:
            bom.cs_version_count = len(bom.cs_version_ids)

    def action_cs_save_version(self, note=False):
        """Freeze the current cost sheet as a new numbered version."""
        Version = self.env["mfg.cost.sheet.version"]
        for bom in self:
            bom._compute_cost_sheet()
            seq = Version.search_count([("bom_id", "=", bom.id)]) + 1
            Version.create({
                "name": "v%d" % seq,
                "bom_id": bom.id,
                "material_cost": bom.cs_material_cost,
                "operation_cost": bom.cs_operation_cost,
                "subtotal": bom.cs_subtotal,
                "rejection_pct": bom.rejection_pct,
                "profit_pct": bom.profit_pct,
                "suggested_price": bom.cs_suggested_price,
                "note": note or False,
            })
        return True
