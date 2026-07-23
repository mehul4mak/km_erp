# VEEHA rates: matched to REMI-equivalent where the part is shared, else estimated
# (scaled for a 500W). Provisional — to be replaced by SLM's real VEEHA sheet.
RATES = {
    'Motor 20mm A/C': 450.0,                        # est (500W < 800W's 565)
    'Top Carrange Grey': 55.0,                       # body set (~170 REMI) split across 6 parts
    'Middle Carrange Grey': 45.0,
    'Base Plate Carrange (Yellow/Teal)': 42.0,
    'Knob Carrange Grey': 12.0,
    'Knob Patti Carrange': 9.0,
    'Knob Ring Carrange': 7.0,
    'SOWBAGHYA VEEHA MG Box': 50.0,                  # = REMI outer box
    'Booklet SOWBAGHYA VEEHA': 3.0,                  # = REMI booklet
    'Bush 411 25mm': 41.0,                           # = REMI 25mm bush
    'Jar Dry Bulbul 22GZ': 74.0,                     # jar set ~148/2
    'Jar Wet Bulbul 22GZ': 74.0,
    'Chutney Jar LBM': 33.0,                         # = REMI chutney jar
    'Dome Lid Transparent Sumo (Wet)': 22.0,         # dome set ~52 split
    'Cap Grey Jaipan': 8.0,
    'Flat Lid Grey Bajaj (Dry/Wet)': 14.0,
    'Flat Lid Grey Bajaj (Chutney)': 8.0,
    'Jar Jumbo GF 411': 20.0,                        # ~REMI jumbo set 41
    'Chutney Jumbo GF 411': 18.0,
    'Spindle Jar Full': 5.5,                         # REMI spindle set 16.5 / 3
    'Spindle Chutney': 5.5,
    'Jar Nut Nylon': 4.0,                            # ~REMI jar nut 5 (nylon cheaper)
    'Chutney Nut 2gm': 2.0,                          # ~REMI multi nut 2.75
    'PP Bag 10x12': 1.75,                            # = REMI plastic bag jar
    'PP Bag 8x10': 1.0,                              # = REMI plastic bag chutney
    'PP Bag 16x22': 2.5,                             # est (larger)
    'PP Bag 25x25': 4.0,                             # est (largest)
    'Screw 10x19': 0.4,                              # ~REMI adapter screw 0.38
    'Screw 6x13': 0.15,                              # = REMI base plate screw
    'Screw 4x6': 0.1,                                # est (tiny)
    'Fabric Washer 1.5mm (8x13)': 0.26,             # = REMI fabric washer
    'Fabric Washer 0.8mm (8x13)': 0.26,
    'Fabric Washer 0.5mm (8x13)': 0.26,
    'Blade Dry J4 Light': 9.0,                       # REMI J4 heavy set 32/3, lighter
    'Blade Wet J4 Light': 9.0,
    'Blade Chutney J4 Light': 8.0,
    'Grommet 4mm': 1.0,                              # est (small)
    'Rubber Bangadi B2': 1.5,                        # est
    'Appu Legs': 1.1,                                # = REMI rubber legs
    'Dome Ring (VEEHA)': 6.0,                        # ~REMI big gasket 9.5, smaller
    'Flat Ring (VEEHA)': 5.0,                        # ~REMI small gasket 7.5
    'Chutney Ring (VEEHA)': 4.0,                     # ~REMI chutney gasket 5
    'Jar Pad (VEEHA)': 2.0,                          # = REMI jar pad
    'Handle Packing SLM 2': 0.5,                     # = REMI rubber handle
    'Chutney Pad 2': 2.0,                            # = REMI chutney pad
    'Mixer Coupler Push-fit 2.5mm': 6.25,           # = REMI motor coupler
    'Jar Coupler Threading 2.5mm': 4.75,            # = REMI jar coupler
    'Jar Box Impex Q800': 12.0,                      # = REMI jar box
    'Screw 5/32x5/16': 0.3,                          # ~REMI chutney screw
    'Master Carton (VEEHA)': 20.0,                   # est (6/carton, cheaper/unit than REMI 28@4)
}
P = env['product.product']
missing = []
for name, cost in RATES.items():
    p = P.search([('name','=',name)], limit=1)
    if not p: missing.append(name); continue
    p.standard_price = cost
if missing:
    print("MISSING PRODUCTS:", missing)

bom = env['mrp.bom'].search([('product_tmpl_id.name','=','SOWBAGHYA VEEHA 500W Mixer Grinder')], limit=1)
bom.invalidate_recordset()
# any component still at 0?
still0 = [l.product_id.name for l in bom.bom_line_ids if l.product_id.standard_price <= 0]
print("components still unpriced:", still0)
print("VEEHA  material=%.2f labour=%.2f subtotal=%.2f rej=%.2f profit=%.2f  SUGGESTED=%.2f" % (
    bom.cs_material_cost, bom.cs_operation_cost, bom.cs_subtotal,
    bom.cs_rejection_amt, bom.cs_profit_amt, bom.cs_suggested_price))
bom.product_tmpl_id.list_price = bom.cs_suggested_price
bom.action_cs_save_version(note="Provisional v1 — rates matched to REMI / estimated, pending SLM VEEHA rate sheet (23-07-2026)")
print("VEEHA list_price=%.2f  versions=%d" % (bom.product_tmpl_id.list_price, bom.cs_version_count))
env.cr.commit()
print("VEEHA RATES COMMITTED")
