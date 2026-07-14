from odoo import api, fields, models


class MrpBom(models.Model):
    _inherit = "mrp.bom"

    rejection_pct = fields.Float(
        string="Rejection / Overhead %", default=2.0,
        help="Allowance for rejection, breakage and rent. From the cost sheet (e.g. 2%).")
    profit_pct = fields.Float(
        string="Target Profit %", default=7.0,
        help="Margin added on top of cost. From the cost sheet (e.g. 7%).")

    cs_material_cost = fields.Float("Material Cost", compute="_compute_cost_sheet", digits="Product Price")
    cs_operation_cost = fields.Float("Labour / Operation Cost", compute="_compute_cost_sheet", digits="Product Price")
    cs_subtotal = fields.Float("Subtotal (Material + Labour)", compute="_compute_cost_sheet", digits="Product Price")
    cs_rejection_amt = fields.Float("Rejection Amount", compute="_compute_cost_sheet", digits="Product Price")
    cs_profit_amt = fields.Float("Profit Amount", compute="_compute_cost_sheet", digits="Product Price")
    cs_suggested_price = fields.Float("Suggested Sale Price", compute="_compute_cost_sheet", digits="Product Price")

    def _cs_costs(self):
        """Recursively roll up material + operation cost for one unit of this BOM,
        descending into sub-assemblies that have their own BOM."""
        self.ensure_one()
        material = 0.0
        operation = 0.0
        for op in self.operation_ids:
            operation += (op.time_cycle_manual / 60.0) * op.workcenter_id.costs_hour
        for line in self.bom_line_ids:
            child = self.env["mrp.bom"]._bom_find(line.product_id).get(line.product_id)
            if child:
                cm, co = child._cs_costs()
                material += cm * line.product_qty
                operation += co * line.product_qty
            else:
                material += line.product_id.standard_price * line.product_qty
        return material, operation

    @api.depends(
        "rejection_pct", "profit_pct", "operation_ids.time_cycle_manual",
        "operation_ids.workcenter_id.costs_hour",
        "bom_line_ids.product_qty", "bom_line_ids.product_id.standard_price",
    )
    def _compute_cost_sheet(self):
        for bom in self:
            material, operation = bom._cs_costs()
            subtotal = material + operation
            rejection = subtotal * (bom.rejection_pct / 100.0)
            profit = (subtotal + rejection) * (bom.profit_pct / 100.0)
            bom.cs_material_cost = material
            bom.cs_operation_cost = operation
            bom.cs_subtotal = subtotal
            bom.cs_rejection_amt = rejection
            bom.cs_profit_amt = profit
            bom.cs_suggested_price = subtotal + rejection + profit

    def action_cs_apply_price(self):
        """Push the computed suggested price onto the product's sale price so it
        flows straight into quotations."""
        for bom in self:
            bom.product_tmpl_id.list_price = bom.cs_suggested_price
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": "Sale price updated",
                "message": "Suggested price applied to the product — ready for quotations.",
                "type": "success",
                "sticky": False,
            },
        }
