# Cost Sheet → Quotation (`addons/mfg_cost_sheet`)

Replaces the client's stale Excel cost sheets with **live BOM costing** that flows straight
into quotations. Extends `mrp.bom` with a "Cost Sheet" tab and computed fields.

## The math (this is the important part)

For one unit of a BOM:

```
material   = Σ over bought components: standard_price × qty
             + recursively, for each sub-assembly with its own BOM: its rolled-up material × qty
operation  = Σ over routing ops: (time_cycle_manual / 60) × workcenter.costs_hour
             + recursively: sub-assembly operation × qty

subtotal   = material + operation
rejection  = subtotal × (rejection_pct / 100)              # default 2%  — rejection/breakage/rent
profit     = (subtotal + rejection) × (profit_pct / 100)   # default 7%  — margin
suggested  = subtotal + rejection + profit
```

Key subtlety: **profit is applied on top of (subtotal + rejection)**, not on subtotal
alone. This ordering is what makes REMI STORM land on the client's number. Don't "simplify"
it to `subtotal × (1 + rej + profit)`.

### Recursion (`_cs_costs`)

`_cs_costs()` walks `bom_line_ids`. For each line it does
`mrp.bom._bom_find(line.product_id).get(line.product_id)`:
- **Has a child BOM** (a sub-assembly, e.g. the motor) → recurse, multiply by line qty.
- **No BOM** (a bought component) → `standard_price × qty`.

So a mixer's motor sub-assembly is costed from *its* components, not a flat number. See
`04-DATA-MODEL.md` for the two-level structure.

## Fields added to `mrp.bom`

| Field | Meaning |
|-------|---------|
| `rejection_pct` | Rejection/overhead %, default **2.0** |
| `profit_pct` | Target profit %, default **7.0** |
| `cs_material_cost` | Rolled-up material |
| `cs_operation_cost` | Rolled-up labour/operation |
| `cs_subtotal` | material + operation |
| `cs_rejection_amt` | rejection amount |
| `cs_profit_amt` | profit amount |
| `cs_suggested_price` | final suggested sale price |

All `cs_*` are `@api.depends`-computed on rejection/profit %, routing time, workcenter
rate, line qty, and component `standard_price` — so editing any input recomputes live.

## Applying the price

`action_cs_apply_price()` pushes `cs_suggested_price` onto `product_tmpl_id.list_price`, so
the next quotation for that product picks it up automatically. In the frontend this is the
"apply price to quotes" action on the Cost Sheets page.

## Benchmark / regression guard

- **REMI STORM 800W**: engine → **₹1,732.51**, client Excel → **~₹1,722**. Match to the rupee.
- Phase-1 rollup check: **motor sub-assembly ≈ ₹561** nested inside REMI STORM material of
  **≈ ₹1,520.75**.
- If you touch this add-on, `scripts/setup_flow.py` recomputes and prints mixer prices —
  eyeball REMI STORM against ₹1,732.51.

## Files

- `addons/mfg_cost_sheet/models/mrp_bom_cost.py` — the model + math.
- `addons/mfg_cost_sheet/views/mrp_bom_views.xml` — the "Cost Sheet" tab + Apply button.
- `__manifest__.py` — module metadata (installed name: "Manufacturing Cost Sheet to Quotation").

## Reload after edits

```bash
docker compose exec odoo odoo -u mfg_cost_sheet -d erp --stop-after-init
docker compose restart odoo
```
