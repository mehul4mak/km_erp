# Mandatory Quality Gates (`addons/mfg_quality`)

Pain point #4: QA was skippable. Odoo **Community has no Quality module** (it's
Enterprise-only), so we built a small custom one that makes QA a **hard, server-side gate**
on manufacturing orders. Because it's enforced in `button_mark_done`, no frontend or API
path can bypass it.

## Model: `mfg.quality.check`

One record = one checkpoint on one MO.

| Field | Notes |
|-------|-------|
| `production_id` | M2O `mrp.production`, `ondelete=cascade` |
| `product_id` | related from the MO |
| `checkpoint` | selection: `in_process` ("In-Process Check"), `final` ("Finished-Goods Check") |
| `state` | `pending` / `pass` / `fail`, default `pending` |
| `note` | inspector notes |
| `checked_by`, `checked_on` | audit stamp (user + datetime) |
| `name` | computed `"<MO> / <checkpoint label>"` |

## The two checkpoints

Every confirmed MO must clear **both**:
1. `in_process` — In-Process Check
2. `final` — Finished-Goods Check

## Lifecycle

- **On confirm:** `MrpProduction.action_confirm()` calls `_ensure_quality_checks()`, which
  creates any missing checkpoints for the MO (idempotent — won't duplicate).
- **Recording a result:** `action_set_result(result, note)` stamps state + user + time.
  **A `fail` spawns a fresh `pending` copy of that checkpoint** (`rec.copy(...)`) — so after
  rework the batch must be re-inspected; a failure can't just be left as terminal.
- **Closing the MO:** `button_mark_done()` raises `UserError` unless `qa_gates_passed`.

## `qa_gates_passed` (the gate condition)

Computed on the MO. True only when **all** hold:
- there is at least one check, **and**
- **no** check is `pending`, **and**
- **each** of `in_process` and `final` has at least one `pass`.

Because a fail always leaves a new pending check behind, an unresolved failure keeps the
gate closed. Clean and hard to game.

## Frontend

The **Quality Gates** page lists checks and records pass/fail; a fail re-opens the gate.
The **Production** page's "mark done" is blocked by the same server rule — the UI just
surfaces the `UserError` message.

## Backfilling existing MOs

New MOs get gates on confirm. For MOs confirmed *before* the module existed,
`scripts/setup_reorder_rules.py` calls `_ensure_quality_checks()` on all non-done/-cancel
MOs.

## Why custom (licensing note)

Odoo Community is LGPL — allows white-labeling and custom modules. The Quality app is
Enterprise-only, and Enterprise's license restricts rebranding. Building `mfg_quality`
ourselves keeps us on Community *and* keeps the white-label rights.

## Files

- `addons/mfg_quality/models/quality_check.py` — model + MO override.
- `addons/mfg_quality/views/mrp_production_views.xml` — MO form integration.
- `addons/mfg_quality/security/ir.model.access.csv` — access rights.

## Reload after edits

```bash
docker compose exec odoo odoo -u mfg_quality -d erp --stop-after-init
docker compose restart odoo
```
