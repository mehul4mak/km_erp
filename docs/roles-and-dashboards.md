# KMForge — Role-Play, Gaps & Dashboards

Written 2026-07-23. Purpose: look at KMForge as each real user at SLM would, find
where it falls short, and lay out the role-based dashboards that bridge the gap.
Today the app has **one identity and one dashboard for everyone** — the biggest
structural gap. Below, each role's "what they live by", what exists today, the
gap, and the dashboard they'd actually want.

---

## 0. The concrete fix first — MO lifecycle & QA alignment

**Problem (observed):** a job sits in `Planned` while both QA gates already read
`Passed`. QA is decoupled from the physical stage of manufacturing.

**Target lifecycle:**

```
Planned ──▶ Started ──▶ In Progress ──▶ QA (finished) ──▶ Done
             │              │                                
             │              └─ In-Process check becomes DUE here
             └─ materials must be reserved to start
                                          Finished-Goods check becomes DUE before Done
```

- **In-Process check** is only actionable once the MO is **In Progress**
  (you're inspecting work that's actually happening).
- **Finished-Goods check** is only actionable when the MO is being **finished**
  (there's a finished unit to inspect).
- `Mark done` stays blocked until both are passed **and** the stage is Finished.

This makes the QA gates mean something and gives every production view a real
"where is this job right now" signal.

---

## 1. CEO / Owner  (SLM group)
- **Lives by:** revenue, margin, cash, growth, on-time delivery, risk.
- **Today:** one confirmed-order-value tile; no trends, no margin realisation,
  no delivery performance, no cash/inventory view, no multi-site rollup.
- **Gap:** everything is "now", single-site, operational — nothing strategic.
- **Dashboard wanted:** revenue & order trend (month-on-month), gross-margin
  (cost-sheet vs actual), on-time-delivery %, cash tied in inventory + WIP,
  top products & customers, **cross-site** rollup (SLM = many plants), a red
  alerts strip (overdue orders, QA failures, st-outs).

## 2. Plant Head  (Virar site)
- **Lives by:** the site running smoothly today — output, readiness, quality.
- **Today:** jobs list, material badges, QA list — but no by-stage board, no
  throughput, no daily plan, no bottleneck.
- **Gap:** can't see the site's day at a glance or where it's stuck.
- **Dashboard wanted:** today's jobs by stage (Planned/In-Progress/QA/Done),
  units in vs out today, material-readiness heat, QA pass-rate, bottleneck
  (what's blocking the most jobs), dispatch-due-today.

## 3. Manufacturing Head  (shop floor)
- **Lives by:** getting jobs through the floor on time.
- **Today:** a flat MO table; you can't see flow or what's blocked by what.
- **Gap:** no kanban, no target-vs-actual, shortages not tied to the job.
- **Dashboard wanted:** a **stage kanban** (Planned → In Progress → QA → Done)
  driven by the new lifecycle, per-job shortage list ("this job is short 12
  motors"), WIP count, today's target vs actual, ageing (jobs stuck too long).

## 4. Sales
- **Lives by:** winning quotes and promising realistic dates.
- **Today:** create quote → confirm; no funnel, no conversion, no promise date,
  no per-quote margin, "Can I Build?" lives apart from the quote.
- **Gap:** can't see the pipeline, can't promise a delivery date at quote time.
- **Dashboard wanted:** quote funnel (Draft→Sent→Won/Lost) + conversion %,
  pipeline value, **promise-date feasibility folded into the quote** (uses Can
  I Build? + lead times), per-line margin vs cost sheet, customer-wise view,
  delivery status of confirmed orders.

## 5. Purchase
- **Lives by:** never stopping the line, buying at the right price/time.
- **Today:** PO list + confirm + new PO; net-requirements raises PODs per order.
- **Gap:** no single "what to buy today" across all demand, no incoming-delivery
  tracker, no vendor performance, no spend analytics, no bill / 3-way match.
- **Dashboard wanted:** consolidated **buy list** (net shortage across all open
  jobs + reorder), incoming deliveries & ETAs, vendor scorecard (on-time %,
  price trend, inward-reject rate), spend by vendor/month, RFQs awaiting.

## 6. QA
- **Lives by:** nothing bad ships; root-causing rejections.
- **Today:** inward + in-process + finished queues exist, but not stage-aligned;
  no trends, no reasons, no supplier-quality.
- **Gap:** QA is a checklist, not a quality system.
- **Dashboard wanted:** unified inspection queue (inward/in-process/finished)
  aligned to MO stage, first-pass-yield & pass/fail trend, rejection reasons
  (Pareto), supplier-quality (inward reject % by vendor), open holds / rework.

## 7. Accounts
- **Lives by:** AR, AP, valuation, GST, margin.
- **Today:** nothing financial is surfaced in KMForge (it lives in Odoo).
- **Gap:** invoicing, vendor bills, inventory valuation, GST, P&L all hidden.
- **Dashboard wanted:** receivables (customer invoices, ageing), payables
  (vendor bills, 3-way match), inventory & WIP valuation, COGS vs sales margin,
  GST summary, cash position.

---

## Cross-cutting gaps
1. **Roles & access** — one login, one dashboard. Need role → tailored home +
   permissions (a Virar operator shouldn't see Nashik or financials).
2. **Time & trends** — everything is a snapshot; no history/analytics.
3. **Alerts** — no proactive "overdue / blocked / failed" signals.
4. **The OUT side** — dispatch/delivery to the customer isn't tracked.
5. **Multi-site** — org has many plants; no rollup (this is the SaaS story).
6. **Financials** — AR/AP/valuation/GST not surfaced.

---

## Phased plan to bridge it

**Phase 1 — Foundation (make the floor honest)**
- MO lifecycle: Planned → Started → In Progress → Finished → Done.
- QA gates become stage-gated (in-process when In Progress; finished before Done).
- Role selector on the profile: pick a role → a tailored dashboard.

**Phase 2 — Role dashboards** (highest-value first)
- Manufacturing kanban (stage board) + per-job shortages.
- Sales funnel + promise-date feasibility on the quote.
- Purchase consolidated buy-list + incoming ETAs.
- QA queue (stage-aligned) + first-pass-yield.

**Phase 3 — Insight**
- Trends/analytics (revenue, output, FPY, spend) + an alerts strip.
- Plant Head & CEO dashboards built on the trend data.

**Phase 4 — Money & scale**
- Accounts: invoicing, vendor bills/3-way match, valuation, GST.
- Multi-site rollup + real role-based access control.

Recommended start: **Phase 1** (concrete, already requested) + the
**Manufacturing kanban** as the first role dashboard.
