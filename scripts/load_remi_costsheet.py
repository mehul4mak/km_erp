BUY = env['stock.route'].search([('name','ilike','buy')], limit=1)
MTO = env['stock.route'].search([('name','ilike','replenish on order')], limit=1) or \
      env['stock.route'].search([('name','ilike','make to order')], limit=1)
UOM = env.ref('uom.product_uom_unit')
CATEG = env['product.category'].browse(1)
Product = env['product.product']

def goc(name, cost):
    """get-or-create a purchased component product; update its cost."""
    p = Product.search([('name','=',name)], limit=1)
    if not p:
        p = Product.create({
            'name': name, 'type': 'product', 'uom_id': UOM.id, 'uom_po_id': UOM.id,
            'categ_id': CATEG.id, 'purchase_ok': True, 'sale_ok': False,
            'route_ids': [(6, 0, [BUY.id] + ([MTO.id] if MTO else []))],
        })
        tag = 'NEW'
    else:
        tag = 'reuse'
    p.standard_price = cost
    return p, tag

# --- Motor becomes a bought part at the manual-sheet rate; archive fiction sub-BOMs ---
env['mrp.bom'].search([('product_tmpl_id.name','in',['Motor 35mm Hybrid','Motor 27mm Hybrid'])]).write({'active': False})
motor = Product.search([('name','=','Motor 35mm Hybrid')], limit=1)
motor.write({'standard_price': 565.0, 'purchase_ok': True,
             'route_ids': [(6,0,[BUY.id] + ([MTO.id] if MTO else []))]})

# --- REMI STORM 800W cost sheet, line-for-line (name, qty, unit_cost) ---
LINES = [
    ('Motor 35mm Hybrid', 1, 565.0),
    ('Body Set 600gm', 1, 170.0),
    ('Rotary Switch 4-pin FR', 1, 19.0),
    ('Circuit Breaker (C.B) FR', 1, 19.0),
    ('Cord Wire 3-core 1.5m', 1, 125.0),
    ('Adapter Screw', 4, 0.38),
    ('Base Plate Screw', 4, 0.15),
    ('Motor Coupler 66 Nylon', 1, 6.25),
    ('C.B Clip', 3, 0.60),
    ('Rubber Legs', 4, 1.10),
    ('Rubber Grommet (full ring)', 1, 6.25),
    ('Rubber Motor Ring', 1, 1.60),
    ('Plastic Unit Bag 51mic', 1, 5.0),
    ('Bush 089 25mm', 2, 41.0),
    ('Bush 411 19mm', 1, 18.0),
    ('Jar Set 2pcs (Wet+Dry)', 1, 148.0),
    ('Chutney Jar Jumbo 100gm', 1, 33.0),
    ('Dome Set', 1, 52.0),
    ('Jumbo Set 50gm GF', 1, 41.0),
    ('Spindle Set 3pcs', 1, 16.5),
    ('Jar Nut 5gm', 2, 5.0),
    ('Multi Nut 3gm Brass', 1, 2.75),
    ('Spring Washer SS', 3, 0.16),
    ('Fabric Washer', 6, 0.26),
    ('Jar Pad Rubber KS2', 2, 2.0),
    ('Chutney Pad Rubber', 1, 2.0),
    ('Big Jar Gasket Ring (Nitrile)', 1, 9.5),
    ('Small Jar Gasket Ring (Nitrile)', 1, 7.5),
    ('Chutney Gasket Ring (Nitrile)', 1, 5.0),
    ('Blade Set J4 Heavy', 1, 32.0),
    ('Chutney Screw', 7, 0.30),
    ('Handle SLM-2', 2, 10.0),
    ('Rubber Handle', 2, 0.50),
    ('Jar Coupler 66 Nylon', 3, 4.75),
    ('Jar Box', 1, 12.0),
    ('Plastic Bag Jar 51mic', 2, 1.75),
    ('Plastic Bag Chutney 51mic', 1, 1.0),
    ('Screen/Buffing/Labels', 1, 10.0),
    ('Outer Box (Printed)', 1, 50.0),
    ('Booklet', 1, 3.0),
    ('Master Carton (per unit)', 1, 28.0),
    ('Clips/Patti', 1, 2.0),
]

newc = []
line_cmds = []
for name, qty, cost in LINES:
    p, tag = goc(name, cost)
    if tag == 'NEW': newc.append(name)
    line_cmds.append((0, 0, {'product_id': p.id, 'product_qty': qty}))

bom = env['mrp.bom'].search([('product_tmpl_id.name','=','REMI STORM 800W Mixer Grinder')], limit=1)
bom.write({
    'bom_line_ids': [(5, 0, 0)] + line_cmds,   # clear then re-add
    'rejection_pct': 2.0, 'profit_pct': 7.0,
})
bom.invalidate_recordset()
print("REMI rebuilt. new products created (%d): %s" % (len(newc), newc))
print("  material=%.2f labour=%.2f subtotal=%.2f rej=%.4f profit=%.4f  PRICE=%.4f" % (
    bom.cs_material_cost, bom.cs_operation_cost, bom.cs_subtotal,
    bom.cs_rejection_amt, bom.cs_profit_amt, bom.cs_suggested_price))
# push suggested price to sale price
bom.product_tmpl_id.list_price = bom.cs_suggested_price
print("  list_price set to %.2f" % bom.product_tmpl_id.list_price)
env.cr.commit()
print("REMI COMMITTED")
