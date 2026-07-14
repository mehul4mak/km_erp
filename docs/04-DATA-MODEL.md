# Master Data & BOMs

Built by `scripts/load_master_data.py` (Phase 1). **Idempotent** — safe to re-run; it
searches by name before creating.

## Data fidelity (POC honesty note)

- Component set is **representative** (~15–24 lines per mixer) using **real names and real
  cost-sheet rates** from the client's files.
- **Motor sub-component rates are ESTIMATES** chosen so the motor rolls up close to the cost
  sheet's motor figure (~₹565 for 35mm, ~₹404 for 27mm). The client's motor BOMs listed
  quantities but not per-part rates, so we back-fitted.
- Bottom line: finished-mixer totals are trustworthy against the cost sheet; individual
  motor-part costs are indicative, not audited.

## Structure: two-level (multi-level) BOMs

```
REMI STORM 800W (manufactured)
├── Motor 35mm Hybrid (manufactured sub-assembly, own BOM)  ← nested
│     ├── Stamping Set 35mm, Copper/Aluminium wire (kg), Bracket,
│     │   Commutator 750W, Carbon Brush ×2, Fan, Shaft 165mm, Bush 003 ×2, misc
│     └── operation: Assembly & Testing, 8 min
├── Body Set, Rotary Switch, Circuit Breaker, Cord, Coupler,
│   Jar Set, Chutney Jar, Dome, Jumbo Set, Spindle, Blade,
│   Handle ×2, Bushes, Rubber, Washers, Bags, Jar Nut, Gasket,
│   Jar Box, Outer Box, Booklet, Master Carton  (all bought)
└── operation: Assembly & Testing, 12 min
```

## Finished products (manufactured)

| Mixer | Motor used | Assembly min |
|-------|-----------|--------------|
| REMI STORM 800W | Motor 35mm Hybrid | 12 |
| PRIDE BREEZA 850W | Motor 35mm Hybrid | 12 |
| SOWBAGHYA VEEHA 500W | Motor 27mm Hybrid | 10 |

REMI and PRIDE share the same component list and 35mm motor; VEEHA uses the 27mm motor.

## Sub-assemblies (manufactured)

- **Motor 35mm Hybrid** — operation 8 min; copper 0.18kg, aluminium 0.10kg, commutator 750W.
- **Motor 27mm Hybrid** — operation 6 min; copper 0.08kg, aluminium 0.06kg, commutator 550W.

## Work center

- **Assembly Line** — `costs_hour = 200.0`, `time_efficiency = 100%`. This rate ×
  routing minutes = the operation/labour cost in the cost sheet.

## Routing & procurement (`scripts/setup_flow.py`, Phase 2)

- Products with a BOM → routes **Manufacture + MTO**.
- Products without a BOM (bought components) → routes **Buy + MTO**, `purchase_ok = True`,
  and get a `product.supplierinfo` (vendor **Veeha Components Pvt Ltd**, price = standard
  cost, 3-day delay) if none exists.
- **MTO (Make-To-Order / "replenish on order")** is activated so a single sales order
  cascades demand all the way down.
- Mixer `list_price` is set from the computed `cs_suggested_price`.

### The demo cascade

One SO — **DEMO-POC-001**, customer **Sharma Distributors**, 10× REMI STORM — when
confirmed auto-generates:
- a **mixer MO** (10× REMI STORM),
- a **nested motor sub-assembly MO**,
- an **RFQ/PO** to the vendor (~33 component lines).

This is the "connected flow" demo: Sales → Manufacturing → sub-assembly → Purchase, no
manual re-keying.

## Reorder rules (`scripts/setup_reorder_rules.py`, Phase 4b)

- Creates `stock.warehouse.orderpoint` min/max = **20 / 100** for every bought-in component
  (skips manufactured items and any that already have a rule). ~37 components.
- Also backfills QA gates on open MOs (see `03-QUALITY-GATES.md`).

## Key numbers to remember

- Motor 35mm rollup ≈ **₹561**; REMI STORM material ≈ **₹1,520.75**; suggested price
  **₹1,732.51** (cost sheet ~₹1,722).
