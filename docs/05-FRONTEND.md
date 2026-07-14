# Frontend — MixerWorks Manufacturing Cloud

Next.js app in `frontend/`, port **3002**. The customer-facing UI; the only thing the
client ever sees. All Odoo access is server-side (see `01-ARCHITECTURE.md`).

## Pages (`frontend/app/`)

| Route | Page | What it does |
|-------|------|--------------|
| `/` | Dashboard | KPIs |
| `/login` | Login | Demo auth (owner@mixerworks.in / demo1234) |
| `/costsheets` + `/costsheets/[id]` | Cost Sheets | Live BOM costing; edit rejection/profit %; apply price to quotes |
| `/orders`, `/orders/new`, `/orders/[id]` | Orders & Quotes | Create quotation → confirm → see linked MOs + component POs |
| `/production` | Production | Material-readiness column + QA-gated "mark done" |
| `/quality` | Quality Gates | Mandatory pass/fail inspections; a fail re-opens the gate |
| `/inventory` | Inventory | On-hand / reserved / incoming / forecast + min-max reorder status |
| `/movements` | Movements | Store→production handoffs & vendor receipts as recorded transactions |
| `/purchasing` | Purchasing | Confirm RFQs |

Each page maps to one of the five pain points (see `00-OVERVIEW.md`).

## Lib (`frontend/lib/`)

- `odoo.js` — JSON-RPC client (`authenticate`, `callKw`, `searchRead`, `inr`). Details in
  `01-ARCHITECTURE.md`.
- `actions.js` — Next.js **server actions** that mutate Odoo (confirm orders, apply price,
  record QA results, confirm RFQs, etc.).
- `auth.js` — POC demo auth. `DEMO_USERS` map, base64 cookie `mw_session`,
  `checkLogin/currentUser/sessionCookieValue`. **Not secure — replace in Phase 5.**

## Components (`frontend/components/`)

- `Shell.js` — app layout/chrome (branded).
- `NavLinks.js` — nav.
- `StatusBadge.js` — status pills.

## Branding

`BRAND_NAME` env var. Nothing in the UI reveals Odoo — no Odoo URLs, model names, or
cookies reach the browser. **Preserve this invariant** when adding features: mutations go
through server actions in `actions.js`, never client-side calls to `:8069`.

## Run

```bash
cd frontend
npm install        # first time
npm run dev        # http://localhost:3002
```

Requires the Odoo backend up and `svc_portal` created (see `06-OPERATIONS.md`), plus
`frontend/.env.local` with ODOO_URL / ODOO_DB / ODOO_LOGIN / ODOO_PASSWORD / BRAND_NAME.

> The frontend is **not** in `docker-compose.yml` — it's a manual `npm run dev` today.
> Containerizing it is a Phase-5 deploy task.
