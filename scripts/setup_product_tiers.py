# Classify products into three tiers and enforce the semantics.
# Run: docker compose exec -T odoo odoo shell -d erp --no-http < scripts/setup_product_tiers.py
# Idempotent.
#
#   Raw / bought-in : no BOM (purchased)
#   Semi-finished   : has a BOM AND is used as a component inside another BOM  -> NOT saleable
#   Finished good   : has a BOM AND is not a component of anything             -> saleable
#
# A semi-finished good (e.g. the in-house motor) must never be sellable on its own.

used_as_component = set(env['mrp.bom.line'].search([]).mapped('product_id').ids)

semi = env['product.product']
finished = env['product.product']
for p in env['product.product'].search([('bom_ids', '!=', False)]):
    if p.id in used_as_component:
        semi |= p
    else:
        finished |= p

# Semi-finished sub-assemblies are not sold to customers
if semi:
    semi.product_tmpl_id.write({'sale_ok': False})
# Finished goods are saleable
if finished:
    finished.product_tmpl_id.write({'sale_ok': True})

env.cr.commit()
print('SEMI-FINISHED (not saleable):', semi.mapped('name'))
print('FINISHED (saleable):', finished.mapped('name'))
print('TIERS SET OK')
