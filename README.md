# Manufacturing ERP — POC (Odoo 17 Community)

A connected Sales → Manufacturing → Inventory → Purchase flow for a kitchen-appliance
(mixer grinder) manufacturer, with a custom **cost-sheet → quotation** add-on and a
**white-label SaaS frontend** (`frontend/`) — the client sees a branded "MixerWorks
Manufacturing Cloud" app; Odoo never appears in the UI.

Based on real client data: multi-level BOMs (mixer = jar set + body set + **motor sub-assembly**)
and an Excel cost sheet (material subtotal → +2% rejection → +7% profit → sale price).

## Documentation

Deep knowledge base lives in [`docs/`](docs/) — start with [`docs/00-OVERVIEW.md`](docs/00-OVERVIEW.md).
Covers the cost-sheet math, QA-gate design, data-model provenance, architecture/security
notes, ops runbook, and the phase roadmap. This README is the quick-start; `docs/` is the
"why".

## Stack
- Odoo 17.0 Community (Sales, Purchase, MRP/Manufacturing, Inventory)
- PostgreSQL 16
- Custom add-ons: `addons/mfg_cost_sheet` (cost sheet → quotation),
  `addons/mfg_quality` (mandatory QA gates — an MO cannot be closed until the
  In-Process and Finished-Goods checks both pass; enforced server-side)
- White-label frontend: `frontend/` (Next.js, port 3002)

## Run it locally

```bash
docker compose up -d        # first boot pulls images (~1-2 GB), takes a few minutes
docker compose logs -f odoo # watch until you see "HTTP service running"
```

Then open http://localhost:8069

1. Create a database (master password is `admin_change_me`, set in `config/odoo.conf`).
   Name it `erp`, set your admin email/password, **load demo data = No**.
2. Go to **Apps**, remove the "Apps" filter, and install:
   **Sales**, **Purchase**, **Manufacturing**, **Inventory**.
3. Install **Manufacturing Cost Sheet to Quotation** (our custom module) once Phase 3 lands.

## White-label frontend (MixerWorks)

Custom Next.js app in `frontend/` — the customer-facing UI. All Odoo access happens
server-side over JSON-RPC (session as the `svc_portal` service user); the browser only
ever talks to the branded app, so nothing reveals Odoo.

```bash
docker compose exec -T odoo odoo shell -d erp --no-http < scripts/create_service_user.py
cd frontend && npm install && npm run dev   # http://localhost:3002
```

Demo login: `owner@mixerworks.in` / `demo1234` (POC-only auth in `frontend/lib/auth.js`).
Backend creds live in `frontend/.env.local` (ODOO_URL / ODOO_DB / ODOO_LOGIN / ODOO_PASSWORD).

Pages: Dashboard (KPIs) · Cost Sheets (live BOM costing, edit rejection/profit %, apply
price to quotes) · Orders & Quotes (create quotation → confirm → see linked production
jobs + component POs) · Production (material readiness + QA-gated "mark done") ·
Quality Gates (mandatory pass/fail inspections; a fail re-opens the gate) · Inventory
(on-hand / reserved / incoming / forecast + min-max reorder status) · Movements
(store→production handoffs and vendor receipts as recorded transactions) · Purchasing
(confirm RFQs).

The five pain points this maps to: unrecorded material handoffs → Movements; no
reorder rules → `scripts/setup_reorder_rules.py` + Inventory health column; manual
availability checks → live "Materials" column on Production; skippable QA →
`mfg_quality` hard gate; stale Excel cost sheets → live Cost Sheets.

## Useful commands
```bash
docker compose ps                 # status
docker compose logs -f odoo       # logs
docker compose restart odoo       # after editing addon code
docker compose down               # stop (keeps data in volumes)
docker compose down -v            # stop + WIPE database/filestore
```

To reload custom-module code after edits, restart Odoo and upgrade the module:
```bash
docker compose exec odoo odoo -u mfg_cost_sheet -d erp --stop-after-init
docker compose restart odoo
```

## Roadmap
- [x] Phase 0 — Local Docker (Odoo + Postgres)
- [x] Phase 1 — Master data: 3 mixers + motor sub-assemblies, components, multi-level BOMs
      (`scripts/load_master_data.py`; verified rollup: motor ₹561 nested in REMI STORM ₹1520.75)
- [x] Phase 2 — Connected flow (`scripts/setup_flow.py`): MTO routes + vendor pricing; one SO for
      10x REMI STORM auto-raised mixer MO + nested motor-sub-assembly MO + one 33-line RFQ to vendor
- [x] Phase 3 — Custom cost-sheet → quotation add-on (rejection % + profit %)
      (BoM "Cost Sheet" tab; REMI STORM computes ₹1732 vs sheet's ₹1722 — rejection/profit match to the rupee)
- [x] Phase 4a — White-label SaaS frontend (`frontend/`, Next.js): branded UI over Odoo
      JSON-RPC; dashboard, live cost sheets, quote→order→MO→PO cascade, inventory health
- [x] Phase 4b — MVP gaps from discovery: `mfg_quality` mandatory QA gates, min/max
      reorder rules (37 components), material-handoff log, live material readiness
- [ ] Phase 5 — Roles (Sales/Purchase/Production/Store), real auth, deploy; later:
      vision QA, OEE dashboard, NL query assistant (AI/IoT upsell layer)
