# Give every purchased component a vendor so the buy-cascade can raise POs.
vendor = env['res.partner'].search([('name','=','SLM Component Suppliers')], limit=1)
if not vendor:
    vendor = env['res.partner'].create({'name':'SLM Component Suppliers','supplier_rank':1,
        'company_type':'company','city':'Mumbai'})
Tmpl = env['product.template']
comps = Tmpl.search([('purchase_ok','=',True),('bom_ids','=',False)])  # all non-manufactured parts
added=0
for t in comps:
    if not t.seller_ids:
        env['product.supplierinfo'].create({
            'partner_id': vendor.id, 'product_tmpl_id': t.id,
            'price': t.standard_price or 1.0, 'delay': 3, 'min_qty': 0})
        added+=1
env.cr.commit()
print("vendor:", vendor.name, "| supplierinfo added to %d components" % added)
