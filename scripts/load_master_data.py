# Phase 1 master data loader — run via:  docker compose exec -T odoo odoo shell -d erp --no-http < scripts/load_master_data.py
# Idempotent: safe to re-run. Builds products, multi-level BOMs (mixer -> motor sub-assembly),
# a work center for labour, and costs taken from the client's cost sheet / BOM files.
#
# NOTE on data fidelity (POC): component set is representative (~15 per mixer), using REAL names and
# REAL cost-sheet rates. Motor sub-component rates are ESTIMATES that roll up close to the cost
# sheet's motor figure (~Rs565 for 35mm) since the motor BOMs list quantities but not rates.

Unit = env.ref('uom.product_uom_unit')
Kg = env.ref('uom.product_uom_kgm')
Route = env['stock.route']
route_mfg = Route.search([('name', 'ilike', 'Manufacture')], limit=1)
route_buy = Route.search([('name', 'ilike', 'Buy')], limit=1)
PT = env['product.template']
Bom = env['mrp.bom']
WC = env['mrp.workcenter']

def product(name, cost, uom, kind):
    p = PT.search([('name', '=', name)], limit=1)
    if p:
        return p
    vals = {
        'name': name,
        'detailed_type': 'product',
        'uom_id': uom.id,
        'uom_po_id': uom.id,
        'standard_price': cost,
        'route_ids': [(6, 0, [(route_buy if kind == 'buy' else route_mfg).id])],
    }
    return PT.create(vals)

def bom(tmpl, lines, operation_min=0):
    existing = Bom.search([('product_tmpl_id', '=', tmpl.id)], limit=1)
    if existing:
        return existing
    bl = [(0, 0, {'product_id': c.product_variant_id.id, 'product_qty': q}) for c, q in lines]
    vals = {'product_tmpl_id': tmpl.id, 'product_qty': 1, 'type': 'normal', 'bom_line_ids': bl}
    if operation_min:
        vals['operation_ids'] = [(0, 0, {
            'name': 'Assembly & Testing', 'workcenter_id': wc.id, 'time_cycle_manual': operation_min,
        })]
    return Bom.create(vals)

# --- Work center (labour / power) -------------------------------------------------
wc = WC.search([('name', '=', 'Assembly Line')], limit=1)
if not wc:
    wc = WC.create({'name': 'Assembly Line', 'costs_hour': 200.0, 'time_efficiency': 100.0})

# --- Motor sub-assemblies (manufactured, own BOM) ---------------------------------
motor35 = product('Motor 35mm Hybrid', 0.0, Unit, 'mfg')
motor27 = product('Motor 27mm Hybrid', 0.0, Unit, 'mfg')

# Motor raw components (rates estimated to roll up ~Rs565 / ~Rs404)
m_stamp35 = product('Stamping Set 35mm', 180, Unit, 'buy')
m_stamp27 = product('Stamping Set 27mm', 140, Unit, 'buy')
copper = product('Copper Wire (enamel)', 850, Kg, 'buy')
alu = product('Aluminium Wire (enamel)', 280, Kg, 'buy')
bracket35 = product('Bracket Kenstar 180gm', 45, Unit, 'buy')
bracket27 = product('Bracket Kenstar 150gm', 38, Unit, 'buy')
commut750 = product('Commutator 750W', 38, Unit, 'buy')
commut550 = product('Commutator 550W', 32, Unit, 'buy')
carbon = product('Carbon Brush', 4, Unit, 'buy')
fan = product('Fan Kenstar', 12, Unit, 'buy')
shaft35 = product('Motor Shaft 165mm', 35, Unit, 'buy')
shaft27 = product('Motor Shaft 157mm', 32, Unit, 'buy')
bush003 = product('Bush 003 MS', 6, Unit, 'buy')
motor_misc = product('Motor Misc (varnish/screws/washers)', 50, Unit, 'buy')

bom(motor35, [
    (m_stamp35, 1), (copper, 0.18), (alu, 0.10), (bracket35, 1), (commut750, 1),
    (carbon, 2), (fan, 1), (shaft35, 1), (bush003, 2), (motor_misc, 1),
], operation_min=8)
bom(motor27, [
    (m_stamp27, 1), (copper, 0.08), (alu, 0.06), (bracket27, 1), (commut550, 1),
    (carbon, 2), (fan, 1), (shaft27, 1), (bush003, 2), (motor_misc, 1),
], operation_min=6)

# --- Shared mixer components (buy) — rates from 800W cost sheet --------------------
body = product('Body Set 600gm', 170, Unit, 'buy')
switch = product('Rotary Switch 4-pin FR', 19, Unit, 'buy')
cb = product('Circuit Breaker (C.B) FR', 19, Unit, 'buy')
cord = product('Cord Wire 3-core 1.5m', 125, Unit, 'buy')
coupler = product('Motor Coupler 66 Nylon', 6.25, Unit, 'buy')
jarset = product('Jar Set 2pcs (Wet+Dry)', 148, Unit, 'buy')
chutney = product('Chutney Jar Jumbo 100gm', 33, Unit, 'buy')
dome = product('Dome Set', 52, Unit, 'buy')
jumbo = product('Jumbo Set 50gm GF', 41, Unit, 'buy')
spindle = product('Spindle Set 3pcs', 16.5, Unit, 'buy')
blade = product('Blade Set J4 Heavy', 32, Unit, 'buy')
handle = product('Handle SLM-2', 10, Unit, 'buy')
bush089 = product('Bush 089 25mm', 41, Unit, 'buy')
bush411 = product('Bush 411 19mm', 18, Unit, 'buy')
rubber = product('Rubber Set (legs/rings/grommet)', 30, Unit, 'buy')
washers = product('Fabric Washer Pack', 5, Unit, 'buy')
pbags = product('Plastic Bag Set', 15, Unit, 'buy')
jarnut = product('Jar Nut Set', 13, Unit, 'buy')
gasket = product('Gasket Ring Set', 22, Unit, 'buy')
jarbox = product('Jar Box', 12, Unit, 'buy')
outerbox = product('Outer Box (Printed)', 50, Unit, 'buy')
booklet = product('Booklet', 3, Unit, 'buy')
carton = product('Master Carton (per unit)', 28, Unit, 'buy')

def mixer_lines(motor):
    return [
        (motor, 1), (body, 1), (switch, 1), (cb, 1), (cord, 1), (coupler, 1),
        (jarset, 1), (chutney, 1), (dome, 1), (jumbo, 1), (spindle, 1), (blade, 1),
        (handle, 2), (bush089, 2), (bush411, 1), (rubber, 1), (washers, 1), (pbags, 1),
        (jarnut, 1), (gasket, 1), (jarbox, 1), (outerbox, 1), (booklet, 1), (carton, 1),
    ]

# --- Finished mixers (manufactured) ----------------------------------------------
remi = product('REMI STORM 800W Mixer Grinder', 0.0, Unit, 'mfg')
pride = product('PRIDE BREEZA 850W Mixer Grinder', 0.0, Unit, 'mfg')
veeha = product('SOWBAGHYA VEEHA 500W Mixer Grinder', 0.0, Unit, 'mfg')

bom(remi, mixer_lines(motor35), operation_min=12)
bom(pride, mixer_lines(motor35), operation_min=12)
bom(veeha, mixer_lines(motor27), operation_min=10)

env.cr.commit()
print('LOADED: products=%d boms=%d workcenters=%d' % (
    PT.search_count([]), Bom.search_count([]), WC.search_count([])))
