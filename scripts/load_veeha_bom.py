BUY = env['stock.route'].search([('name','ilike','buy')], limit=1)
MTO = env['stock.route'].search([('name','ilike','replenish on order')], limit=1) or \
      env['stock.route'].search([('name','ilike','make to order')], limit=1)
UOM = env.ref('uom.product_uom_unit')
CATEG = env['product.category'].browse(1)
Product = env['product.product']

def goc(name, cost):
    p = Product.search([('name','=',name)], limit=1)
    created = False
    if not p:
        p = Product.create({
            'name': name, 'type': 'product', 'uom_id': UOM.id, 'uom_po_id': UOM.id,
            'categ_id': CATEG.id, 'purchase_ok': True, 'sale_ok': False,
            'route_ids': [(6, 0, [BUY.id] + ([MTO.id] if MTO else []))],
        })
        created = True
    if cost is not None:
        p.standard_price = cost
    return p, created

# VEEHA 500W real BOM: (name, qty, cost)  cost=None => rate pending
LINES = [
    ('Motor 20mm A/C', 1, None),
    ('Top Carrange Grey', 1, None),
    ('Middle Carrange Grey', 1, None),
    ('Base Plate Carrange (Yellow/Teal)', 1, None),
    ('Knob Carrange Grey', 1, None),
    ('Knob Patti Carrange', 1, None),
    ('Knob Ring Carrange', 1, None),
    ('Rotary Switch 4-pin FR', 1, 19.0),
    ('Circuit Breaker (C.B) FR', 1, 19.0),
    ('Cord Wire 3-core 1.5m', 1, 125.0),
    ('SOWBAGHYA VEEHA MG Box', 1, None),
    ('Booklet SOWBAGHYA VEEHA', 1, None),
    ('Bush 411 25mm', 2, None),
    ('Bush 411 19mm', 1, 18.0),
    ('Jar Dry Bulbul 22GZ', 1, None),
    ('Jar Wet Bulbul 22GZ', 1, None),
    ('Chutney Jar LBM', 1, None),
    ('Dome Lid Transparent Sumo (Wet)', 1, None),
    ('Cap Grey Jaipan', 1, None),
    ('Flat Lid Grey Bajaj (Dry/Wet)', 1, None),
    ('Flat Lid Grey Bajaj (Chutney)', 1, None),
    ('Jar Jumbo GF 411', 2, None),
    ('Chutney Jumbo GF 411', 1, None),
    ('Spindle Jar Full', 2, None),
    ('Spindle Chutney', 1, None),
    ('Jar Nut Nylon', 2, None),
    ('Chutney Nut 2gm', 1, None),
    ('PP Bag 10x12', 1, None),
    ('PP Bag 8x10', 1, None),
    ('PP Bag 16x22', 2, None),
    ('PP Bag 25x25', 1, None),
    ('Screw 10x19', 4, None),
    ('Screw 6x13', 4, None),
    ('Screw 4x6', 1, None),
    ('Fabric Washer 1.5mm (8x13)', 3, None),
    ('Fabric Washer 0.8mm (8x13)', 3, None),
    ('Fabric Washer 0.5mm (8x13)', 3, None),
    ('Blade Dry J4 Light', 1, None),
    ('Blade Wet J4 Light', 1, None),
    ('Blade Chutney J4 Light', 1, None),
    ('Handle SLM-2', 1, 10.0),
    ('Grommet 4mm', 4, None),
    ('Rubber Bangadi B2', 1, None),
    ('Appu Legs', 4, None),
    ('Dome Ring (VEEHA)', 1, None),
    ('Flat Ring (VEEHA)', 1, None),
    ('Chutney Ring (VEEHA)', 1, None),
    ('Jar Pad (VEEHA)', 2, None),
    ('Handle Packing SLM 2', 1, None),
    ('Chutney Pad 2', 1, None),
    ('Mixer Coupler Push-fit 2.5mm', 1, None),
    ('Jar Coupler Threading 2.5mm', 3, None),
    ('Jar Box Impex Q800', 1, None),
    ('Screw 5/32x5/16', 5, None),
    ('Master Carton (VEEHA)', 1, None),
]

pending = []; line_cmds = []
for name, qty, cost in LINES:
    p, created = goc(name, cost)
    if cost is None: pending.append(name)
    line_cmds.append((0, 0, {'product_id': p.id, 'product_qty': qty}))

bom = env['mrp.bom'].search([('product_tmpl_id.name','=','SOWBAGHYA VEEHA 500W Mixer Grinder')], limit=1)
bom.write({'bom_line_ids': [(5,0,0)] + line_cmds, 'rejection_pct': 2.0, 'profit_pct': 7.0})
bom.invalidate_recordset()
print("VEEHA BOM rebuilt: %d lines, %d priced, %d PENDING RATE" % (
    len(LINES), len(LINES)-len(pending), len(pending)))
print("  partial material (priced parts only) = %.2f" % bom.cs_material_cost)
print("  NOTE: list_price left unchanged (costing incomplete, not applied to quotes)")
print("PENDING:", pending)
env.cr.commit()
print("VEEHA COMMITTED")
