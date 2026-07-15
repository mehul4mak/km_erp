# Phase 5a — inbound flow demo setup. Run AFTER installing the mfg_receiving module:
#   docker compose exec odoo odoo -i mfg_receiving -d erp --stop-after-init && docker compose restart odoo
#   docker compose exec -T odoo odoo shell -d erp --no-http < scripts/setup_receiving.py
# Idempotent. Enables FIFO valuation and confirms the demo PO so a Goods Receipt is raised.

# --- FIFO valuation (safe while on-hand is zero) --------------------------------
cats = env['product.category'].search([])
for c in cats:
    if c.property_cost_method != 'fifo':
        c.property_cost_method = 'fifo'
print('FIFO cost method:', set(cats.mapped('property_cost_method')))

# --- Confirm the demo PO so an incoming receipt (GRN) exists --------------------
po = env['purchase.order'].search([('state', 'in', ['draft', 'sent'])], limit=1)
if po:
    po.button_confirm()
    print('PO confirmed:', po.name, po.state)
else:
    print('No draft PO to confirm (already done?)')

# --- Ensure every incoming receipt has an inward QC check ready -----------------
picks = env['stock.picking'].search([('picking_type_id.code', '=', 'incoming')])
picks._ensure_inward_check()
for p in picks:
    print('RECEIPT %s | vendor=%s | origin=%s | state=%s | lines=%d | qc_passed=%s'
          % (p.name, p.partner_id.name, p.origin, p.state, len(p.move_ids), p.inward_qc_passed))

env.cr.commit()
print('RECEIVING SETUP OK')
