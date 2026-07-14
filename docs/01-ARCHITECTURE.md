# Architecture

## High-level

```
Browser ──HTTPS──► Next.js app (frontend/, :3002)
                     │  server components + server actions only
                     │  JSON-RPC as service user  svc_portal
                     ▼
                   Odoo 17 Community (erp-odoo, :8069)
                     │
                     ▼
                   PostgreSQL 16 (erp-db, :5432 internal)
```

The **browser never talks to Odoo directly.** Every Odoo call happens inside Next.js
server code (`frontend/lib/odoo.js`) using the `svc_portal` service account. This is what
makes the white-label promise real: no Odoo URLs, cookies, or model names ever reach the
client. Keep it that way — do not add client-side `fetch` to `:8069`.

## Containers (`docker-compose.yml`)

| Service | Container | Image | Ports | Notes |
|---------|-----------|-------|-------|-------|
| db | `erp-db` | `postgres:16` | 5432 (internal) | volume `db-data`; healthcheck `pg_isready` |
| odoo | `erp-odoo` | `odoo:17.0` | `8069:8069` | volumes `odoo-data`, `./config/odoo.conf`, `./addons` → `/mnt/extra-addons` |

`docker compose down` keeps data (named volumes). `docker compose down -v` **wipes** the
database and filestore.

> Note: on this machine other unrelated containers also run (open-webui :3000,
> splitmate-frontend :3001). The MixerWorks frontend uses **:3002** and is not in compose.

## Odoo config (`config/odoo.conf`)

- `admin_passwd = admin_change_me` — DB master password (change before any real deploy).
- `addons_path` includes `/mnt/extra-addons` (our `addons/`).
- `workers = 0` — single-process, fine for a POC; revisit for deploy.
- `list_db = True` — DB manager visible at `/web/database/manager`; **disable for prod**.
- DB: host `db`, user/pass `odoo`/`odoo`.

## The JSON-RPC layer (`frontend/lib/odoo.js`)

- `authenticate()` → `POST /web/session/authenticate` with `svc_portal` creds; caches the
  session cookie in a module-level variable.
- `callKw(model, method, args, kwargs)` → `POST /web/dataset/call_kw`. On a session-expiry
  error it re-authenticates **once** and retries.
- `searchRead(model, domain, fields, kwargs)` — thin helper.
- `inr(n)` — `Intl.NumberFormat('en-IN', INR)` money formatter used across the UI.

Env vars (in `frontend/.env.local`, git-ignored): `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`,
`ODOO_PASSWORD`, `BRAND_NAME`. Defaults in code point at `localhost:8069` / db `erp` /
login `svc_portal`.

### Caveat: module-level session cache

`sessionCookie` is a single module-global. Fine for a single-user POC. For multi-user /
serverless deploy this becomes a shared-mutable-state hazard (one user's expiry re-auth
races another's request) — revisit in Phase 5.

## Auth (POC vs real)

- **Frontend demo auth** (`frontend/lib/auth.js`): a hard-coded `DEMO_USERS` map, session in
  a base64 cookie `mw_session`. One user: `owner@mixerworks.in` / `demo1234`
  (Rajesh Gupta, role "Owner"). Explicitly labelled POC-only — **swap for a real IdP** in
  Phase 5. Base64 is *not* encryption/signing; anyone can forge the cookie today.
- **Backend service user** `svc_portal`: created by `scripts/create_service_user.py`; the
  single identity the frontend uses to reach Odoo. Not the same as the demo login.
  Password `svc_portal_2026!` (reset on every run). Granted groups:
  `sales_team.group_sale_salesman_all_leads`, `purchase.group_purchase_user`,
  `mrp.group_mrp_user`, `stock.group_stock_user`. Broad enough for the frontend's reads +
  writes; scope down in Phase 5.

## Security TODO before any real deployment (Phase 5)

- Real identity provider + signed/encrypted sessions (drop the base64 cookie).
- Rotate/scope `svc_portal`; move secrets out of `.env.local` into a secret manager.
- Change `admin_passwd`; set `list_db = False`.
- Per-role permissions (Sales / Purchase / Production / Store).
