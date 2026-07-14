# Roadmap & Phase History

## Completed

- [x] **Phase 0** — Local Docker (Odoo 17 + Postgres 16).
- [x] **Phase 1** — Master data: 3 mixers + 2 motor sub-assemblies, components, multi-level
      BOMs (`load_master_data.py`). Verified rollup: motor ≈ ₹561 nested in REMI STORM
      material ≈ ₹1,520.75.
- [x] **Phase 2** — Connected flow (`setup_flow.py`): MTO routes + vendor pricing; one SO for
      10× REMI STORM auto-raises mixer MO + nested motor MO + ~33-line RFQ to vendor.
- [x] **Phase 3** — Custom cost-sheet → quotation add-on (`mfg_cost_sheet`): rejection % +
      profit %. REMI STORM computes ₹1,732.51 vs sheet ~₹1,722 — matches to the rupee.
- [x] **Phase 4a** — White-label Next.js frontend: branded UI over Odoo JSON-RPC; dashboard,
      live cost sheets, quote→order→MO→PO cascade, inventory health.
- [x] **Phase 4b** — MVP gaps from discovery: `mfg_quality` mandatory QA gates, min/max
      reorder rules (37 components), material-handoff log, live material readiness.

All **five discovery pain points** addressed (see `00-OVERVIEW.md`).

## Phase 5 — production-readiness (next)

Goal: move from POC to something a real factory could log into.

1. **Roles** — Sales / Purchase / Production / Store; per-role permissions and page access.
2. **Real auth** — replace the base64 demo cookie with a real identity provider; signed/
   encrypted sessions; drop hard-coded `DEMO_USERS`.
3. **Deploy** — containerize the frontend; production Odoo config
   (`admin_passwd` changed, `list_db = False`, workers > 0); secrets out of `.env.local`;
   HTTPS; backups.
4. **Version control** — `git init` (not yet a repo). Do this **first** in Phase 5.
5. **Harden the RPC layer** — the module-level `sessionCookie` in `odoo.js` is a shared-
   mutable-state hazard under concurrency; make it per-request/per-user.

## Phase 2 upsell (deliberately later — the AI/IoT layer)

Not the entry point. Sold after the ERP basics land:
- **Vision QA** — camera-based defect detection at the QA gates.
- **OEE dashboard** — Overall Equipment Effectiveness / line utilization.
- **NL query assistant** — natural-language questions over the ERP data.

Rationale: the client's felt pain is the boring operational stuff (handoffs, reorders, QA,
costing). Land on that; expand into AI once trust and data exist.

## Open questions / decisions to revisit

- Motor sub-part rates are back-fitted estimates (see `04-DATA-MODEL.md`) — refine if the
  client shares real per-part motor rates.
- Reorder min/max is a flat 20/100 for all components — should be per-part (lead time,
  consumption rate) for real use.
- Single warehouse assumed.
