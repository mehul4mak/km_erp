# KMForge — Procure-to-Production Flow
### Customer presentation · 15 July 2026 · by **KMatrix AI**

> This build extends KMForge from "quote → make → ship" into the **real inbound
> discipline of a factory**: goods receipt, inward quality, FIFO store, and material
> requisition — the way materials actually move on your shop floor.

---

## 1. Your process, in your words

In our last discussion you described how materials really flow through the plant. We
took each point and laid it out in the system:

| # | What you told us | Where it now lives |
|---|------------------|--------------------|
| 1 | *"I don't see a page to add a customer."* | **Contacts** page — add customers & vendors |
| 2 | *"Material cost inside the cost sheet should be FIFO-based."* | **FIFO valuation** switched on; cost sheet reads it |
| 3 | *"When purchase is done there's a GRN, then inward quality inspection; only when the lot is OK does it go to store."* | **Goods Receipt (GRN)** + **Inward Quality Inspection** + **Receive to store** |
| 4 | *"Store material is FIFO-based for production."* | Store issues components **FIFO** |
| 5 | *"Production makes a BOM and sends it to the store manager; they confirm and keep that material aside, marked for production XYZ."* | **Material Requisition** — reserve & earmark components per job |
| 6 | *"BOM and cost sheet have to be connected; I want to modify and version the cost sheet."* | Cost sheet already lives **on the BOM**; versioning + approval is the next step (§5) |
| 7 | *"GRN → bill, and an IGP (inward gate pass)."* | Vendor bill / 3-way match & IGP gate-entry — designed, next (§5) |

---

## 2. The connected flow

```
                         ┌─────────────── SELL ───────────────┐
   Cost Sheet  ─────────▶  Quotation ─▶ Order ─▶ (auto) MO + sub-MO
   (on the BOM, FIFO)                                    │
                                                         ▼
   ┌──────────────────────── BUY / INWARD ───────────────────────────┐
   │  Purchase Order ─▶ Goods Receipt (GRN) ─▶ Inward Quality Inspect │
   │                                              │ accept   │ reject │
   │                                              ▼          ▼        │
   │                                     Received to STORE   held —   │
   │                                     (FIFO valuation)   not stocked│
   └──────────────────────────────┬──────────────────────────────────┘
                                   ▼
   ┌───────────────────────── MAKE ──────────────────────────┐
   │  Material Requisition: store RESERVES components (FIFO)  │
   │  and marks them aside for THIS job  ─▶  Production  ─▶   │
   │  Quality Gates (mandatory) ─▶ Finished goods ─▶ Dispatch │
   └─────────────────────────────────────────────────────────┘
```

The rule that makes it real: **nothing enters the store until inward QC accepts it, and
nothing is consumed by production until the store has reserved it against that specific job.**

---

## 3. What's live today — the demo

Sign in at the app with **owner@kmforge.cloud / demo1234**. Suggested demo path:

1. **Contacts → + Add contact** — add a customer (e.g. *Anand Kitchen Appliances*). It appears
   in the Customers list immediately. *(Fills the "no page to add a customer" gap.)*
2. **Purchasing → Confirm PO** — confirm the RFQ raised from the order. This creates a **Goods
   Receipt**.
3. **Goods Receipt (GRN)** — the receipt from *Veeha Components* (70 lines) shows **awaiting
   inspection**.
   - **Accept lot** → inward QC passes.
   - **Receive to store →** posts the goods into stock (FIFO). *Try "Receive to store" before
     accepting — it is blocked.* This is the enforced inward-QC gate.
4. **Inventory** — the components are now **on hand** with **FIFO unit costs**, health **ok**.
5. **Material Requisition** — each job shows its components straight from the BOM.
   - **Motor job** → **Reserve materials** → every component shows **"reserved for this job."**
   - **Mixer job** → all bought parts reserve, but the **Motor sub-assembly shows "awaiting
     stock"** — because it must be *built* first. That is correct manufacturing logic, live.

**What each screen proves**

| Screen | Proves |
|--------|--------|
| Contacts | Customer/vendor master data is self-serve |
| Goods Receipt (GRN) | Every vendor delivery is a controlled receipt |
| Inward Quality Inspection | A rejected lot **cannot** enter stock — server-enforced |
| Receive to store | Accepted goods post to a **FIFO** store |
| Inventory | Live on-hand, reserved, FIFO unit cost, reorder health |
| Material Requisition | Store **reserves & earmarks** components per job, FIFO |

---

## 4. What we built under the hood (for the record)

- **New module `mfg_receiving`** — adds an **Inward Quality Inspection** to every incoming
  receipt and blocks posting to store until the lot is *Accepted* (mirrors our mandatory
  manufacturing QA-gate pattern, applied to inbound goods).
- **FIFO valuation** enabled on all stock — material cost is now first-in-first-out.
- **Four new screens** — Contacts, Goods Receipt, Material Requisition (+ the add-contact form).
- All of it behind the same white-label UI; the Odoo engine underneath stays invisible.

---

## 5. Designed & coming next

Clearly scoped, not yet built — so you know the road:

| Item | What it adds |
|------|--------------|
| **IGP — Inward Gate Pass** | A gate-entry document before the GRN: vehicle, challan, gate-in time — the security-gate log |
| **Vendor Bill & 3-way match** | GRN → Bill, auto-matched against PO & receipt (PO ↔ GRN ↔ Bill) before payment |
| **Cost-sheet versioning & approval** | Save each cost sheet as a dated, BOM-linked version with who-changed-what and an approve step — full history and audit |
| **Lot / batch traceability** | Track which receipt lot went into which production job; visible FIFO layers |
| **Reject / return-to-vendor** | Formal debit-note flow for lots that fail inward QC |

---

## 6. Requirement checklist

| Requirement | Status |
|-------------|--------|
| Add-customer page | ✅ Built |
| Material cost FIFO in cost sheet | ✅ Built |
| GRN on purchase receipt | ✅ Built |
| Inward quality inspection before store | ✅ Built (enforced) |
| Lot OK → goes to store | ✅ Built |
| Store issues FIFO for production | ✅ Built |
| Production BOM → store reserves & marks aside | ✅ Built (Material Requisition) |
| BOM ↔ cost sheet connected | ✅ Already connected |
| Modify & **version** the cost sheet | 🟡 Modify: done · Versioning: next |
| Vendor bill after GRN | 🟡 Designed |
| IGP (inward gate pass) | 🟡 Designed |

---

## 7. Honest status (POC)

- The **inward QC gate and FIFO store are real and enforced** end-to-end — this is not a mockup.
- **Cost-sheet versioning, the vendor bill/3-way match, and IGP** are designed and scoped, not
  yet built — shown here as the committed next step, not claimed as done.
- Auth is still a demo login; the app runs locally. Production hardening (roles, real auth,
  hosting) remains the separate Phase-5 track.

*KMForge — Manufacturing Cloud · by KMatrix AI*
