# Phase 2 — connected flow: SO -> MO -> (sub-assembly MO) -> RFQ/PO -> receive -> produce.
# Run: docker compose exec -T odoo odoo shell -d erp --no-http < scripts/setup_flow.py
# Idempotent.

Partner = env['res.partner']
PT = env['product.template']
Route = env['stock.route']
SupplierInfo = env['product.supplierinfo']

# --- Partners -------------------------------------------------------------------
cust = Partner.search([('name', '=', 'Sharma Distributors')], limit=1)
if not cust:
    cust = Partner.create({'name': 'Sharma Distributors', 'customer_rank': 1})
vend = Partner.search([('name', '=', 'Veeha Components Pvt Ltd')], limit=1)
if not vend:
    vend = Partner.create({'name': 'Veeha Components Pvt Ltd', 'supplier_rank': 1})

# --- Routes (activate MTO so demand cascades) -----------------------------------
route_mfg = Route.search([('name', 'ilike', 'Manufacture')], limit=1)
route_buy = Route.search([('name', 'ilike', 'Buy')], limit=1)
mto = Route.with_context(active_test=False).search([('name', 'ilike', 'Make To Order')], limit=1)
if not mto:
    mto = Route.with_context(active_test=False).search([('name', 'ilike', 'replenish on order')], limit=1)
if mto and not mto.active:
    mto.active = True

# --- Classify products: manufactured (has BOM) vs components --------------------
for p in PT.search([('detailed_type', '=', 'product')]):
    if p.bom_ids:
        p.route_ids = [(6, 0, [route_mfg.id, mto.id])]
    else:
        p.route_ids = [(6, 0, [route_buy.id, mto.id])]
        p.purchase_ok = True
        if not p.seller_ids:
            SupplierInfo.create({
                'partner_id': vend.id,
                'product_tmpl_id': p.id,
                'price': p.standard_price or 1.0,
                'delay': 3,
            })

# --- Set sale prices on mixers from their cost sheet -----------------------------
for name in ['REMI STORM 800W Mixer Grinder', 'PRIDE BREEZA 850W Mixer Grinder',
             'SOWBAGHYA VEEHA 500W Mixer Grinder']:
    t = PT.search([('name', '=', name)], limit=1)
    b = t.bom_ids[:1]
    if b:
        b._compute_cost_sheet()
        t.list_price = round(b.cs_suggested_price, 2)

env.cr.commit()
print('SETUP OK: customer=%s vendor=%s mto_active=%s' % (cust.name, vend.name, bool(mto and mto.active)))

# --- Fire one demo Sales Order through the chain --------------------------------
SO = env['sale.order']
existing = SO.search([('client_order_ref', '=', 'DEMO-POC-001')], limit=1)
if existing:
    so = existing
    print('DEMO SO already exists: %s (state=%s)' % (so.name, so.state))
else:
    remi = PT.search([('name', '=', 'REMI STORM 800W Mixer Grinder')], limit=1)
    so = SO.create({
        'partner_id': cust.id,
        'client_order_ref': 'DEMO-POC-001',
        'order_line': [(0, 0, {'product_id': remi.product_variant_id.id, 'product_uom_qty': 10})],
    })
    so.action_confirm()
    env.cr.commit()
    print('CONFIRMED SO: %s  total=Rs %.2f' % (so.name, so.amount_total))

# --- Report what the chain generated --------------------------------------------
grp = so.procurement_group_id
mos = env['mrp.production'].search([('procurement_group_id', '=', grp.id)]) if grp else env['mrp.production']
pos = env['purchase.order'].search([('origin', 'like', so.name)]) if so else env['purchase.order']
print('GENERATED -> Manufacturing Orders: %d | Purchase Orders/RFQs: %d'
      % (len(mos), len(pos)))
for m in mos:
    print('   MO %s  product=%s  qty=%s  state=%s' % (m.name, m.product_id.name, m.product_qty, m.state))
for p in pos:
    print('   PO %s  vendor=%s  lines=%d  state=%s' % (p.name, p.partner_id.name, len(p.order_line), p.state))
