import Link from "next/link";
import Shell from "@/components/Shell";
import { callKw, searchRead, inr } from "@/lib/odoo";
import { updateCostSheet, applyPrice, saveCostSheetVersion } from "@/lib/actions";

export const dynamic = "force-dynamic";

async function bomLines(bomId) {
  const lines = await searchRead(
    "mrp.bom.line",
    [["bom_id", "=", bomId]],
    ["product_id", "product_qty"]
  );
  const prodIds = lines.map((l) => l.product_id[0]);
  const prods = await searchRead(
    "product.product",
    [["id", "in", prodIds]],
    ["standard_price", "bom_ids"]
  );
  const info = Object.fromEntries(prods.map((p) => [p.id, p]));
  return lines.map((l) => ({
    ...l,
    cost: info[l.product_id[0]]?.standard_price || 0,
    isSubAssembly: (info[l.product_id[0]]?.bom_ids || []).length > 0,
  }));
}

export default async function CostSheetDetail({ params }) {
  const bomId = parseInt(params.id, 10);
  const [bom] = await callKw("mrp.bom", "read", [
    [bomId],
    [
      "product_tmpl_id",
      "cs_material_cost",
      "cs_operation_cost",
      "cs_subtotal",
      "cs_rejection_amt",
      "cs_profit_amt",
      "cs_suggested_price",
      "rejection_pct",
      "profit_pct",
    ],
  ]);
  const lines = await bomLines(bomId);
  const [tmpl] = await callKw("product.template", "read", [
    [bom.product_tmpl_id[0]],
    ["list_price", "sale_ok"],
  ]);
  const versions = await searchRead(
    "mfg.cost.sheet.version",
    [["bom_id", "=", bomId]],
    ["name", "material_cost", "subtotal", "rejection_pct", "profit_pct", "suggested_price", "note", "saved_by", "create_date"],
    { order: "create_date desc" }
  );

  const update = updateCostSheet.bind(null, bomId);
  const apply = applyPrice.bind(null, bomId);
  const saveVersion = saveCostSheetVersion.bind(null, bomId);

  return (
    <Shell
      title={bom.product_tmpl_id[1]}
      crumb={`Cost sheet — updates instantly when component rates or percentages change`}
    >
      <div className="page-actions">
        <Link href="/costsheets" className="btn secondary">
          ← All cost sheets
        </Link>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Bill of Materials ({lines.length} components)</h2>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th className="num">Qty</th>
                <th className="num">Rate</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.product_id[1]}{" "}
                    {l.isSubAssembly && (
                      <span className="badge blue">made in-house</span>
                    )}
                  </td>
                  <td className="num">{l.product_qty}</td>
                  <td className="num">{inr(l.cost)}</td>
                  <td className="num">{inr(l.cost * l.product_qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Cost Build-up</h2>
            <div className="costsheet-row">
              <span className="lbl">Material cost (incl. sub-assemblies)</span>
              <span className="mono">{inr(bom.cs_material_cost)}</span>
            </div>
            <div className="costsheet-row">
              <span className="lbl">Labour &amp; assembly</span>
              <span className="mono">{inr(bom.cs_operation_cost)}</span>
            </div>
            <div className="costsheet-row">
              <span className="lbl">Subtotal</span>
              <span className="mono">{inr(bom.cs_subtotal)}</span>
            </div>
            <div className="costsheet-row">
              <span className="lbl">
                Rejection / overhead @ {bom.rejection_pct}%
              </span>
              <span className="mono">{inr(bom.cs_rejection_amt)}</span>
            </div>
            <div className="costsheet-row">
              <span className="lbl">Profit @ {bom.profit_pct}%</span>
              <span className="mono">{inr(bom.cs_profit_amt)}</span>
            </div>
            <div className="costsheet-row total">
              <span>Suggested sale price</span>
              <span className="mono">{inr(bom.cs_suggested_price)}</span>
            </div>
            {tmpl.sale_ok ? (
              <>
                <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 13 }}>
                  Current sale price on quotes: <b>{inr(tmpl.list_price)}</b>
                </div>
                <form action={apply} style={{ marginTop: 14 }}>
                  <button className="btn" style={{ width: "100%", justifyContent: "center" }}>
                    Apply {inr(bom.cs_suggested_price)} to quotations
                  </button>
                </form>
              </>
            ) : (
              <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 13 }}>
                <span className="badge blue">semi-finished</span> This item isn&rsquo;t sold
                on its own — its cost feeds the parent product&rsquo;s sheet automatically.
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Adjust Percentages</h2>
            <form action={update}>
              <div className="field">
                <label>Rejection / overhead %</label>
                <input
                  name="rejection_pct"
                  type="number"
                  step="0.1"
                  defaultValue={bom.rejection_pct}
                />
              </div>
              <div className="field">
                <label>Target profit %</label>
                <input
                  name="profit_pct"
                  type="number"
                  step="0.1"
                  defaultValue={bom.profit_pct}
                />
              </div>
              <button className="btn secondary">Recalculate</button>
            </form>
          </div>

          <div className="card">
            <h2>Save a Version</h2>
            <div style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 10 }}>
              Freeze the current sheet before a rate or material change, so you keep a dated
              record of what the cost was and why it moved.
            </div>
            <form action={saveVersion}>
              <div className="field">
                <label>Reason for change (optional)</label>
                <input name="note" placeholder="e.g. copper rate up to ₹880/kg" />
              </div>
              <button className="btn secondary">Save current as version</button>
            </form>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Version History ({versions.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Version</th>
              <th>Saved</th>
              <th className="num">Material</th>
              <th className="num">Rejection %</th>
              <th className="num">Profit %</th>
              <th className="num">Price</th>
              <th>Reason</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {versions.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  No versions saved yet — save one to start tracking changes.
                </td>
              </tr>
            )}
            {versions.map((v) => (
              <tr key={v.id}>
                <td className="mono" style={{ fontWeight: 700 }}>{v.name}</td>
                <td>{(v.create_date || "").slice(0, 16)}</td>
                <td className="num">{inr(v.material_cost)}</td>
                <td className="num">{v.rejection_pct}%</td>
                <td className="num">{v.profit_pct}%</td>
                <td className="num" style={{ fontWeight: 700 }}>{inr(v.suggested_price)}</td>
                <td>{v.note || "—"}</td>
                <td>{v.saved_by?.[1] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
