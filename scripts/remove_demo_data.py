Bom = env['mrp.bom'].with_context(active_test=False)
REAL = ['REMI STORM 800W Mixer Grinder','SOWBAGHYA VEEHA 500W Mixer Grinder']
real = Bom.search([('product_tmpl_id.name','in',REAL)])
keep_tmpl = set(real.mapped('product_tmpl_id').ids)
for b in real:
    keep_tmpl |= set(b.bom_line_ids.mapped('product_id.product_tmpl_id').ids)

Tmpl = env['product.template'].with_context(active_test=False)
orphans = Tmpl.search([('id','not in',list(keep_tmpl))])
oprods = orphans.mapped('product_variant_ids')

# 1. delete every BOM that is NOT one of the two real ones (PRIDE + archived motor fiction)
junk_boms = Bom.search([('product_tmpl_id.name','not in',REAL)])
print("deleting %d junk BOMs" % len(junk_boms)); junk_boms.unlink()

# 2. clear residual references
env['stock.quant'].with_context(active_test=False).search([('product_id','in',oprods.ids)]).sudo().unlink()
env['stock.warehouse.orderpoint'].search([('product_id','in',oprods.ids)]).unlink()
env['product.supplierinfo'].search([('product_tmpl_id','in',orphans.ids)]).unlink()

# 3. delete orphan products
orphans.unlink()
env.cr.commit()
print("deleted %d orphan products" % len(orphans))
print("remaining products:", env['product.template'].search_count([]), "| BOMs:", env['mrp.bom'].search_count([]))
print("CLEANUP FINAL DONE")
