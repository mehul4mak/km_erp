# Manufacturing SaaS — Feature Landscape, ISO/Warehouse/Logistics Best Practices & KMForge Gap Analysis

**Prepared for:** KMForge Manufacturing Cloud (SLM · Virar plant — mixer-grinder manufacturing)
**Date:** 2026-07-23 · **Author:** KMatrix AI research

This report surveys what modern manufacturing SaaS platforms offer, the best
practices for **ISO-grade quality on manufacturing orders**, and for **warehouse
& logistics**, then maps them against what KMForge does today — with a
prioritised plan to close the gaps.

---

## 1. Executive summary

KMForge already covers the **core make-to-order backbone** better than many
entry tools: live cost sheets from BOMs, net-requirements planning, an honest
MO lifecycle with **stage-gated quality**, auto-purchasing, inward QC and FIFO
valuation. Where it trails the market is in five areas that turn a "production
tracker" into a **manufacturing operating system**:

1. **Traceability** — no lot/serial or genealogy (the #1 ISO 9001 requirement).
2. **Warehouse depth** — no bin/location, barcode, or cycle counting.
3. **Logistics / dispatch** — the outbound side (delivery, e-way bill, POD) is absent.
4. **Formal quality system** — QA gates exist, but no NCR → CAPA loop, MRB, or document control.
5. **Insight & scheduling** — no OEE, finite scheduling, trends, or role dashboards.

None of these require replacing the foundation — they extend it. A phased plan
is in §9.

---

## 2. The manufacturing-SaaS landscape (what the leaders ship)

| Platform | Sweet spot | Signature strengths |
|---|---|---|
| **Katana** | e-commerce / light mfg | live inventory, slick UI, sales-channel sync, traceability, outsourcing |
| **MRPeasy** | small discrete mfg | deep MRP, production scheduling & shop-floor control, procurement, job costing, CRM |
| **Fulcrum** | job-shop / make-to-order | scheduling, shop-floor MES, quoting |
| **Odoo MRP** (our backend) | broad ERP | MRP, WMS, quality (Enterprise), accounting, barcode |
| **Tulip / MES-class** | operations | real-time machine data, operator apps, OEE, work instructions |

Consistent best-practice themes across all of them:

- **BOM & routing → costing** kept live (KMForge ✅).
- **MRP + net requirements** so you make/buy only the shortfall (KMForge ✅).
- **Shop-floor execution** with real work-order states and operator capture (KMForge partial — lifecycle now, no operator/time capture).
- **Traceability** end-to-end (KMForge ❌).
- **Analytics/OEE & scheduling** (KMForge ❌).

---

## 3. Best practices by domain

### 3.1 Product, BOM & costing
- Multi-level BOMs, versioned, with routing and cost roll-up. **KMForge:** ✅ (cost sheets, versioning, 3-tier catalog, "Can I Build?" explosion).

### 3.2 Planning & scheduling
- **MRP / net requirements** — ✅ done.
- **Finite-capacity scheduling (APS)** respecting machine/tool/skill limits. Industry data: schedule adherence rises from ~70–80 % (manual/basic ERP) to **92–98 %** with finite scheduling. **KMForge:** ❌ (no capacity/calendar/sequencing).
- **OEE** (Availability × Performance × Quality) — the single most-tracked KPI. **KMForge:** ❌.

### 3.3 Shop-floor / MO execution (MES)
- Real work-order states, operator ID + timestamps, in-process capture, machine/PLC signals, digital work instructions.
- **KMForge:** ✅ MO lifecycle (Planned→Started→In Progress→Finished→Done) + stage-gated QA; ❌ operator/time capture, work instructions, machine data.

### 3.4 Quality & ISO 9001 (see §4 for the MO-specific plan)
- **Identification & traceability (Clause 8.5.2)** — every unit/lot identifiable through the chain.
- **Control of nonconforming output (Clause 8.7)** — quarantine, disposition authority, records.
- **Corrective action / CAPA (Clause 10.2)** — NCRs feed root-cause and preventive action.
- **MRB** (Material Review Board) closing the loop NCR → CAPA with effectiveness checks.
- **Document & record control**, audit trail, supplier quality (inward reject %).
- **KMForge:** ✅ mandatory in-process + finished QA gates, inward QC on receipts, immutable timestamps/inspector; ❌ lot/serial genealogy, NCR/CAPA workflow, MRB, document control, supplier-quality analytics.

### 3.5 Warehouse / WMS
- **Bin/location** management, directed **putaway** and **picking**.
- **Lot / serial tracking** with a unique ID captured at receiving → putaway → pick, using **GS1-128** barcodes for downstream traceability.
- **Barcode/RFID** scanning with on-device validation; **cycle counting**.
- Tight **WMS ↔ ERP/MES** integration so inventory & finance auto-reconcile.
- **KMForge:** ✅ single-location stock, FIFO valuation, GRN with inward QC, requisitions/reservations; ❌ multi-bin/location, barcode, lot/serial, cycle count.

### 3.6 Logistics & dispatch (the outbound gap)
- **TMS integration**: dispatch order → carrier → **proof of delivery**, freight cost, real-time status.
- **India specifics**: automatic **E-Way Bill** (GSTN) and **e-invoice** generation as part of dispatch, VAHAN vehicle checks, FASTag/GPS tracking.
- **KMForge:** ❌ no delivery/dispatch tracking, no e-way bill / e-invoice, no carrier or POD.

### 3.7 Procurement & vendor
- 3-way match (PO ↔ receipt ↔ bill), vendor scorecards (on-time %, price trend, reject %), consolidated buy-list.
- **KMForge:** ✅ auto-RFQ from net requirements, manual PO, receipts; ❌ vendor bill / 3-way match, scorecards, consolidated buy-list.

### 3.8 Finance
- Inventory & WIP valuation, COGS vs margin, AR/AP, GST returns.
- **KMForge:** ✅ FIFO valuation under the hood; ❌ nothing financial surfaced (invoicing, bills, AR/AP, GST, P&L).

### 3.9 Analytics & Industry 4.0 / 5.0
- Standard KPI set: **OEE, on-time delivery, first-pass yield, schedule adherence, cost/unit**.
- Trends: **digital twins** (maintenance cost −55 %, fastest-growing segment), **prescriptive maintenance** (AI RCA + remediation), **IIoT** (25 % productivity gains), edge/cloud, human-centric Industry 5.0.
- **KMForge:** ❌ snapshot-only, no trends/KPIs, no IoT — but positioned to add an AI/IoT upsell layer (vision QA, OEE, NL assistant).

---

## 4. Integrating ISO 9001 into the Manufacturing Order (concrete plan)

The MO is where ISO quality is won or lost. A staged plan on top of the lifecycle
we just built:

1. **Lot / serial genealogy (Clause 8.5.2)** — assign a **lot number** to each MO
   output and a **serial** to each finished mixer; record which component lots
   were consumed, so any unit's history reconstructs (which motor lot, which
   cord-wire batch, which inward-QC result, which operator, when). Print a
   **GS1-128** label at Finished. *Foundation for everything below.*
2. **Nonconformance (Clause 8.7)** — when an in-process or finished check **fails**,
   auto-raise an **NCR** with a disposition (rework / scrap / use-as-is / return
   to vendor) and an authorised sign-off; quarantine the lot (already blocked
   from stock).
3. **CAPA (Clause 10.2)** — NCRs with recurring causes roll into a **CAPA** with
   root-cause (5-why/fishbone), action owner, due date, and an **effectiveness
   check** — the closed loop the standard requires.
4. **Supplier quality** — inward-QC rejects feed a **vendor reject-rate** metric
   and can trigger a supplier NCR.
5. **Document & record control** — versioned SOP/work-instruction attached to the
   BOM/MO; every QA action already carries who/when (immutable) — extend with an
   audit log and e-signature.
6. **Audit view** — one screen that reconstructs a lot's full genealogy for an
   ISO 9001 auditor without manual digging.

Mapping to clauses: **8.5.2** (traceability), **8.7** (nonconforming output),
**10.2** (corrective action) — these three are the audit core.

---

## 5. Warehouse & logistics integration plan

**Warehouse (make it a real WMS):**
1. **Locations/bins** under the plant (store, WIP, QC-hold, finished, dispatch).
2. **Lot/serial** capture at GRN → putaway → issue → finished (ties to §4.1).
3. **Barcode** app: scan on receive, put-away, requisition-issue, finished-label,
   and dispatch — GS1-128 for external traceability.
4. **Cycle counting** to keep on-hand honest without a full stock-take.

**Logistics (open the outbound side):**
1. **Delivery / dispatch order** from a confirmed sale → pick → pack → ship, with
   status to the customer.
2. **E-Way Bill + e-invoice** auto-generated at dispatch (GSTN) — mandatory in
   India; VAHAN/vehicle capture.
3. **Proof of delivery** and carrier/TMS hook (freight cost, tracking).

---

## 6. Where KMForge stands — honest inventory (as of this build)

**Have (✅):** product master/catalog (3-tier), multi-level BOM + live cost sheets
with versioning, "Can I Build?" pegging, contacts, quotations → orders,
**net-requirements** make-to-stock, **MO lifecycle with stage-gated QA**, inward
QC on receipts (blocks stock until accepted), material requisitions/reservations,
auto-RFQ + manual PO, FIFO valuation, single-location inventory with reorder
signal, document metadata + cross-links, white-labelled UI.

**Not yet (❌):** lot/serial traceability, NCR/CAPA/MRB, multi-bin WMS + barcode,
dispatch/logistics + e-way bill, OEE + finite scheduling, vendor bills/3-way
match, financials (AR/AP/GST), trends/analytics, role-based dashboards & access,
multi-site rollup.

---

## 7. Gap matrix

| Domain | Best-practice target | KMForge | Priority |
|---|---|---|---|
| BOM & costing | multi-level, versioned, roll-up | ✅ | — |
| MRP / net requirements | make/buy the shortfall | ✅ | — |
| MO execution | states + operator/time capture | 🟡 lifecycle only | Med |
| **Traceability** | lot/serial genealogy, GS1 | ❌ | **High (ISO)** |
| **Quality system** | NCR → CAPA → MRB | 🟡 gates only | **High (ISO)** |
| Warehouse / WMS | bins, barcode, cycle count | ❌ | High |
| **Logistics / dispatch** | delivery, e-way bill, POD | ❌ | **High (India)** |
| Procurement | 3-way match, vendor score | 🟡 RFQ/PO only | Med |
| Finance | valuation, AR/AP, GST | 🟡 valuation only | Med |
| Scheduling | finite/APS, OEE | ❌ | Med |
| Analytics | KPIs, trends, role dashboards | ❌ | High |
| Industry 4.0 | IoT, digital twin, predictive | ❌ | Upsell (Phase 2) |

---

## 8. How we improve — top recommendations

1. **Lot/serial traceability first** — it unlocks ISO §4, WMS §5, and recalls. Single highest-leverage build.
2. **NCR → CAPA loop** on the QA gates we already have — small delta, big compliance value.
3. **Dispatch + e-way bill** — the missing outbound half; legally required in India and expected by every buyer.
4. **Multi-bin WMS + barcode app** — turns the store into a real warehouse.
5. **Role dashboards + KPIs (OEE, OTD, FPY)** — makes the data decision-grade (ties to the role-play doc).
6. Keep **IoT/vision-QA/digital-twin** as the **Phase-2 AI upsell**, not the entry point.

## 9. Suggested roadmap

- **Phase A — Compliance core:** lot/serial genealogy → NCR/CAPA → ISO audit view.
- **Phase B — Warehouse & logistics:** bins + barcode + cycle count; dispatch + e-way bill + POD.
- **Phase C — Insight:** OEE + KPIs + role dashboards + finite scheduling.
- **Phase D — Money & scale:** invoicing/bills/3-way match/GST; multi-site + RBAC.
- **Phase E — Smart layer (upsell):** IIoT/OEE live, vision QA, prescriptive maintenance, NL assistant.

---

## Sources

- [Katana vs MRPeasy — Craftybase](https://craftybase.com/compare/katana-vs-mrpeasy)
- [Best Manufacturing ERP 2026 — SaaSCompared](https://saascompared.io/blog/best-manufacturing-erp-software-2026/)
- [Katana vs MRPeasy — StackArbiter](https://stackarbiter.com/compare/katana-vs-mrpeasy/)
- [ISO 9001 Clause 8.5.2 Identification & Traceability — Qualityze](https://www.qualityze.com/blogs/iso-9001-clause-8-5-2-identification-traceability)
- [Integrating NCR & CAPA — ComplianceQuest](https://www.compliancequest.com/cq-guide/integrate-non-conformance-reports-with-capa/)
- [Integrate MRB with ERP/MES for Traceability](https://beefed.ai/en/integrate-mrb-erp-mes-traceability)
- [How ISO 9001 supports traceability — Connect981](https://connect981.com/faqs/how-does-iso-9001-support-traceability-requirements-in-manufacturing)
- [WMS lot traceability setup — Lace Up Solutions](https://www.laceupsolutions.com/guide-to-setting-up-a-wms-for-lot-traceability/)
- [Barcode scanning & lot tracking in WMS — ERP Software Blog](https://erpsoftwareblog.com/2025/09/benefits-of-barcode-scanning/)
- [Barcode WMS best practices — Novacura](https://www.novacura.com/barcode-wms-best-practices/)
- [OEE & production KPIs guide — MDCplus](https://mdcplus.fi/blog/oee-production-kpi-complete-guide/)
- [50 Manufacturing KPIs — User Solutions](https://usersolutions.com/blog/manufacturing-kpis-guide)
- [Best production planning software 2026 — JITbase](https://www.jitbase.com/blog/best-production-planning-software-manufacturers)
- [ERP + TMS logistics integration — Roado](https://roado.co.in/blog/why-erp-logistics-integration-with-a-tms-is-the-missing-link-in-manufacturing-supply-chains/)
- [TMS & e-way bill for India — eShipz](https://www.eshipz.com/blog/transportation-management-system-india-logistics-eshipz/)
- [Industry 4.0 trends 2026 — StartUs Insights](https://www.startus-insights.com/innovators-guide/industry-4-0-trends/)
- [Smart manufacturing trends 2026 — RTInsights](https://www.rtinsights.com/smart-manufacturing-trends-2026-how-ai-iot-and-automation-are-driving-efficiency-and-resilience/)
