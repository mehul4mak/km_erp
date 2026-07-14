# Reorder rules (min/max) for bought-in components + QA gates on existing MOs.
# Run: docker compose exec -T odoo odoo shell -d erp --no-http < scripts/setup_reorder_rules.py
# Idempotent.

PT = env['product.template']
Orderpoint = env['stock.warehouse.orderpoint']
wh = env['stock.warehouse'].search([], limit=1)

created = 0
for p in PT.search([('detailed_type', '=', 'product'), ('purchase_ok', '=', True)]):
    if p.bom_ids:
        continue  # only bought-in components
    variant = p.product_variant_id
    if Orderpoint.search([('product_id', '=', variant.id)], limit=1):
        continue
    Orderpoint.create({
        'product_id': variant.id,
        'warehouse_id': wh.id,
        'location_id': wh.lot_stock_id.id,
        'product_min_qty': 20,
        'product_max_qty': 100,
    })
    created += 1

# Backfill QA gates on already-confirmed MOs (new ones get them on confirm)
mos = env['mrp.production'].search([('state', 'not in', ['done', 'cancel'])])
mos._ensure_quality_checks()

env.cr.commit()
print('REORDER RULES: created=%d total=%d | QA gates ensured on %d MOs'
      % (created, Orderpoint.search_count([]), len(mos)))
