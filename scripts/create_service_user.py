# Create/ensure a service user for the white-label frontend proxy.
# Run: docker compose exec -T odoo odoo shell -d erp --no-http < scripts/create_service_user.py
# Idempotent.

Users = env['res.users']
u = Users.search([('login', '=', 'svc_portal')], limit=1)
if not u:
    u = Users.create({
        'name': 'Portal Service',
        'login': 'svc_portal',
        'password': 'svc_portal_2026!',
    })
    print('CREATED svc_portal id=%s' % u.id)
else:
    u.password = 'svc_portal_2026!'
    print('EXISTS svc_portal id=%s (password reset)' % u.id)

# Grant the groups the frontend needs: sales, purchase, mrp, stock (user-level + admin where needed for writes)
group_xmlids = [
    'sales_team.group_sale_salesman_all_leads',
    'purchase.group_purchase_user',
    'mrp.group_mrp_user',
    'stock.group_stock_user',
]
gids = []
for x in group_xmlids:
    try:
        gids.append(env.ref(x).id)
    except Exception as e:
        print('MISSING group %s: %s' % (x, e))
u.groups_id = [(4, g) for g in gids]
env.cr.commit()
print('GROUPS OK: %s' % [g.name for g in u.groups_id])
