# Make-to-stock: remove the MTO ("replenish on order") route from FINISHED GOODS
# only, so confirming a sale no longer auto-manufactures them. Semi-finished
# sub-assemblies and bought-in components keep MTO, so the shortfall MO still
# cascades to motor sub-jobs and component POs.
# Run: docker compose exec -T odoo odoo shell -d erp --no-http < scripts/setup_mts.py
# Idempotent.

Route = env['stock.route'].with_context(active_test=False)
mto = (Route.search([('name', 'ilike', 'make to order')], limit=1)
       or Route.search([('name', 'ilike', 'replenish on order')], limit=1))

used_as_component = set(env['mrp.bom.line'].search([]).mapped('product_id').ids)

finished = env['product.product']
for p in env['product.product'].search([('bom_ids', '!=', False)]):
    if p.id not in used_as_component:      # finished good (not consumed by anything)
        finished |= p

if mto:
    finished.product_tmpl_id.write({'route_ids': [(3, mto.id)]})

env.cr.commit()
print('MTO removed from finished goods:', finished.mapped('name'))
for p in finished:
    print('  %-38s routes=%s' % (p.name, p.product_tmpl_id.route_ids.mapped('name')))
print('MTS SETUP OK')
