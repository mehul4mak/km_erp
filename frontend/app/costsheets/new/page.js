import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";
import { createCostSheet } from "@/lib/actions";
import CostSheetBuilder from "@/components/CostSheetBuilder";

export const dynamic = "force-dynamic";

export default async function NewCostSheet({ searchParams }) {
  // Any purchasable/component product can be a line on a new sheet.
  const components = await searchRead(
    "product.product",
    [["purchase_ok", "=", true]],
    ["name", "standard_price"],
    { order: "name asc" }
  );

  return (
    <Shell
      title="New Cost Sheet"
      crumb="Define a finished product and its bill of materials — the price is computed for you"
    >
      <div className="card" style={{ maxWidth: 720 }}>
        {searchParams?.error === "name" && (
          <div className="login-error" style={{ marginBottom: 14 }}>
            Give the product a name.
          </div>
        )}
        {searchParams?.error === "empty" && (
          <div className="login-error" style={{ marginBottom: 14 }}>
            Add at least one component line.
          </div>
        )}
        <form action={createCostSheet}>
          <div className="field">
            <label>Product name</label>
            <input name="name" required placeholder="e.g. REMI BLAZE 750W Mixer Grinder" />
          </div>

          <div className="field">
            <CostSheetBuilder components={components} />
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 150 }}>
              <label>Labour / assembly (₹)</label>
              <input name="labour" type="number" step="0.01" min="0" defaultValue="40" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 120 }}>
              <label>Rejection %</label>
              <input name="rejection_pct" type="number" step="0.1" defaultValue="2" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 120 }}>
              <label>Profit %</label>
              <input name="profit_pct" type="number" step="0.1" defaultValue="7" />
            </div>
          </div>

          <div className="field">
            <label>Opening sale price (optional — you can apply the computed one later)</label>
            <input name="list_price" type="number" step="0.01" min="0" defaultValue="0" />
          </div>

          <button className="btn">Create cost sheet</button>
          <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 10 }}>
            Material comes from each component&rsquo;s rate; labour, rejection and profit build up
            to the suggested price on the next screen.
          </div>
        </form>
      </div>
    </Shell>
  );
}
