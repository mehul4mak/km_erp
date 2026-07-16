from odoo import fields, models


class SaleOrderLine(models.Model):
    _inherit = "sale.order.line"

    mts_from_stock = fields.Float("Reserved From Stock", digits="Product Unit of Measure")
    mts_to_make = fields.Float("To Manufacture", digits="Product Unit of Measure")


class SaleOrder(models.Model):
    _inherit = "sale.order"

    def action_confirm(self):
        # Capture free finished-goods stock BEFORE confirming — the delivery
        # created by super() reserves available stock and would otherwise drive
        # free_qty to zero, making us over-manufacture. Allocate that free stock
        # across the lines (running tally per product) so each line's shortfall
        # is what genuinely has to be made.
        from_stock = {}
        remaining = {}
        for order in self:
            for line in order.order_line:
                product = line.product_id
                if not product or line.product_uom_qty <= 0 or line.display_type:
                    continue
                if product.id not in remaining:
                    remaining[product.id] = max(0.0, product.free_qty)
                take = min(remaining[product.id], line.product_uom_qty)
                from_stock[line.id] = take
                remaining[product.id] -= take

        res = super().action_confirm()
        for order in self:
            order._plan_manufacture_shortfall(from_stock)
        return res

    def _plan_manufacture_shortfall(self, from_stock):
        """Net requirements at the finished-good level: reserve what's in stock,
        manufacture only the shortfall. Finished goods carry no MTO route so
        nothing is auto-made; we launch a manufacture procurement for the
        shortfall via Odoo's procurement engine, so the resulting MO cascades
        to its sub-assembly jobs and component purchases exactly as MTO would."""
        self.ensure_one()
        Bom = self.env["mrp.bom"]
        Group = self.env["procurement.group"]
        warehouse = self.warehouse_id
        location = warehouse.lot_stock_id

        group = self.procurement_group_id
        if not group:
            group = Group.create({"name": self.name, "sale_id": self.id})
            self.procurement_group_id = group.id

        procurements = []
        for line in self.order_line:
            product = line.product_id
            if not product or line.product_uom_qty <= 0 or line.display_type:
                continue
            bom = Bom._bom_find(product, company_id=self.company_id.id).get(product)
            if not bom:
                continue  # bought / non-manufactured

            ordered = line.product_uom_qty
            covered = from_stock.get(line.id, 0.0)
            shortfall = round(ordered - covered, 6)

            line.mts_from_stock = covered
            line.mts_to_make = max(0.0, shortfall)

            if shortfall <= 0:
                continue  # fully covered by stock — no job

            values = {
                "group_id": group,
                "date_planned": fields.Datetime.now(),
                "warehouse_id": warehouse,
                "company_id": self.company_id,
            }
            procurements.append(Group.Procurement(
                product, shortfall, product.uom_id, location,
                product.display_name, self.name, self.company_id, values))

        if procurements:
            Group.run(procurements)
