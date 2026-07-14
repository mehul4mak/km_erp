# MixerWorks Manufacturing Cloud — Project Overview

> Living knowledge base for the manufacturing-ERP POC. This `docs/` set captures the
> decisions, math, and provenance that don't live in code comments. Start here.

## What this is

A **white-label manufacturing SaaS** for a small kitchen-appliance (mixer-grinder)
manufacturer. Under the hood it is **Odoo 17 Community**; on top sits a custom Next.js
app (**"MixerWorks Manufacturing Cloud"**). The client must never see Odoo — the product
should feel like bespoke manufacturing software built for them.

- **Backend:** Odoo 17.0 Community (Sales, Purchase, MRP/Manufacturing, Inventory) + PostgreSQL 16, in Docker.
- **Custom Odoo add-ons:** `mfg_cost_sheet`, `mfg_quality`.
- **Frontend:** `frontend/` — Next.js, port **3002**. Talks to Odoo **only server-side** via JSON-RPC.

## Who / business context

- End customer: a mixer-grinder manufacturer producing brands like **REMI STORM 800W**,
  **PRIDE BREEZA 850W**, **SOWBAGHYA VEEHA 500W**.
- Product sold *to* that manufacturer as a branded SaaS — MixerWorks is the white-label wrapper.
- Business model: land with the ERP basics (the five pain points below); **upsell** the
  AI/IoT layer (vision QA, OEE dashboards, NL query assistant) as **phase 2**. AI is
  deliberately *not* the entry point.

## The five pain points (the whole reason this exists)

From the client discovery chat (2026-07-05). All five addressed as of Phase 4.

| # | Pain point | How it's solved | Where |
|---|-----------|-----------------|-------|
| 1 | Unrecorded material handoffs (store→production) | Movements log — recorded transactions | frontend `Movements` page |
| 2 | No reorder rules → stockouts | Min/max order points (37 components) | `scripts/setup_reorder_rules.py` + Inventory health column |
| 3 | Manual availability checks before starting a job | Live material-readiness column | frontend `Production` page |
| 4 | Skippable QA | Mandatory server-side QA gates | `addons/mfg_quality` |
| 5 | Stale Excel cost sheets | Live BOM costing → quotation | `addons/mfg_cost_sheet` + `Cost Sheets` page |

## Correctness benchmark

The **REMI STORM 800W** cost sheet is the golden reference: our engine computes a
suggested price of **₹1,732.51**, versus the client's Excel sheet at **~₹1,722** —
rejection % and profit % match essentially to the rupee. Any change that moves this number
should be treated as a regression until proven otherwise. See `02-COST-SHEET.md`.

## Doc map

- `00-OVERVIEW.md` — this file
- `01-ARCHITECTURE.md` — stack, containers, white-label RPC boundary, auth
- `02-COST-SHEET.md` — the cost-sheet math + `mfg_cost_sheet` add-on
- `03-QUALITY-GATES.md` — `mfg_quality` mandatory-QA design
- `04-DATA-MODEL.md` — products, multi-level BOMs, master-data provenance
- `05-FRONTEND.md` — pages, RPC layer, demo auth
- `06-OPERATIONS.md` — run/setup/reset commands, scripts, gotchas
- `07-ROADMAP.md` — phase history + Phase 5 plan

## Current status (as of 2026-07-14)

- Phases 0–4 complete. Backend (`erp-odoo`, `erp-db`) runs in Docker.
- Frontend is a local `npm run dev` app (**not** containerized) — must be started manually.
- Not yet under version control (no git repo).
- Next up: **Phase 5** — roles, real auth, deploy.
