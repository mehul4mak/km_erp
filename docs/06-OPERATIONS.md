# Operations — Run, Setup, Reset

## First-time bring-up

```bash
# 1. Start backend (first boot pulls ~1-2 GB images)
docker compose up -d
docker compose logs -f odoo          # wait for "HTTP service running"

# 2. Create the database via http://localhost:8069
#    - master password: admin_change_me  (config/odoo.conf)
#    - db name: erp
#    - load demo data: NO
#    - set an admin email/password

# 3. Install apps in Odoo: Sales, Purchase, Manufacturing, Inventory
#    (Apps → remove "Apps" filter → install). Then install the two custom modules:
#    "Manufacturing Cost Sheet to Quotation" and the QA module.

# 4. Load data + service user (all idempotent, order matters):
docker compose exec -T odoo odoo shell -d erp --no-http < scripts/load_master_data.py
docker compose exec -T odoo odoo shell -d erp --no-http < scripts/setup_flow.py
docker compose exec -T odoo odoo shell -d erp --no-http < scripts/setup_reorder_rules.py
docker compose exec -T odoo odoo shell -d erp --no-http < scripts/create_service_user.py

# 5. Frontend
cd frontend && npm install && npm run dev     # http://localhost:3002
```

## The scripts (all idempotent)

| Script | Phase | Purpose |
|--------|-------|---------|
| `load_master_data.py` | 1 | Products, multi-level BOMs, work center. Prints counts. |
| `setup_flow.py` | 2 | Routes+MTO, vendor pricing, sale prices; fires demo SO `DEMO-POC-001` (10× REMI STORM) and reports generated MO/PO. |
| `setup_reorder_rules.py` | 4b | Min/max (20/100) order points for components; backfills QA gates on open MOs. |
| `create_service_user.py` | 4a | Creates `svc_portal` service user the frontend authenticates as. |

Run order for a fresh DB: master data → flow → reorder rules → service user.

## Everyday commands

```bash
docker compose ps                 # status
docker compose logs -f odoo       # logs
docker compose restart odoo       # after editing addon code
docker compose down               # stop, keep data
docker compose down -v            # stop and WIPE db + filestore  (destructive!)
```

## Reload a custom module after editing its code

```bash
docker compose exec odoo odoo -u mfg_cost_sheet -d erp --stop-after-init
# or:  -u mfg_quality
docker compose restart odoo
```

## Smoke test (is it alive?)

```bash
docker ps --format '{{.Names}}\t{{.Status}}'      # erp-odoo + erp-db up?
curl -sS http://localhost:8069/web/database/manager -o /dev/null -w '%{http_code}\n'
# then load http://localhost:3002 and log in owner@mixerworks.in / demo1234
```

## Gotchas

- **Frontend not containerized** — it won't come up with `docker compose up`; start it
  manually with `npm run dev`.
- **`down -v` is destructive** — wipes the Odoo DB and filestore; you'd re-run all four
  setup scripts afterward.
- **Not a git repo yet** — no version history/backups of code changes. Initializing git is
  an early Phase-5 task; until then, be careful with edits.
- **Secrets in `frontend/.env.local`** (git-ignored) — includes `ODOO_PASSWORD`.
