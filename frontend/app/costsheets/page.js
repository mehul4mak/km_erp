import Link from "next/link";
import Shell from "@/components/Shell";
import { searchRead, inr } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export default async function CostSheets() {
  const boms = await searchRead(
    "mrp.bom",
    [],
    [
      "product_tmpl_id",
      "cs_material_cost",
      "cs_operation_cost",
      "cs_subtotal",
      "cs_suggested_price",
      "rejection_pct",
      "profit_pct",
    ]
  );
  const tmplIds = boms.map((b) => b.product_tmpl_id[0]);
  const tmpls = await searchRead(
    "product.template",
    [["id", "in", tmplIds]],
    ["list_price", "sale_ok"]
  );
  const tmplOf = Object.fromEntries(tmpls.map((t) => [t.id, t]));

  // A cost sheet is only trustworthy if every component carries a rate. Count
  // components still priced at 0 per BOM so an incomplete sheet can't be
  // mistaken for a final one (and its suggested price ignored for quoting).
  const bomIds = boms.map((b) => b.id);
  const allLines = bomIds.length
    ? await searchRead("mrp.bom.line", [["bom_id", "in", bomIds]], ["bom_id", "product_id"])
    : [];
  const prodIds = [...new Set(allLines.map((l) => l.product_id[0]))];
  const prods = prodIds.length
    ? await searchRead("product.product", [["id", "in", prodIds]], ["standard_price"])
    : [];
  const costOf = Object.fromEntries(prods.map((p) => [p.id, p.standard_price]));
  const pendingByBom = {};
  for (const l of allLines) {
    if ((costOf[l.product_id[0]] || 0) <= 0)
      pendingByBom[l.bom_id[0]] = (pendingByBom[l.bom_id[0]] || 0) + 1;
  }

  return (
    <Shell
      title="Cost Sheets"
      crumb="Live costing for every product — material, labour, rejection and margin in one place"
    >
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Material</th>
              <th className="num">Labour</th>
              <th className="num">Rejection %</th>
              <th className="num">Profit %</th>
              <th className="num">Suggested Price</th>
              <th className="num">Current Sale Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {boms.map((b) => {
              const tmpl = tmplOf[b.product_tmpl_id[0]] || {};
              const saleable = tmpl.sale_ok !== false;
              const current = tmpl.list_price || 0;
              const pending = pendingByBom[b.id] || 0;
              const stale = saleable && !pending && Math.abs(current - b.cs_suggested_price) > 0.5;
              return (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.product_tmpl_id[1]}</td>
                  <td className="num">{inr(b.cs_material_cost)}</td>
                  <td className="num">{inr(b.cs_operation_cost)}</td>
                  <td className="num">{b.rejection_pct}%</td>
                  <td className="num">{b.profit_pct}%</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {pending ? (
                      <span style={{ color: "var(--muted)" }}>{inr(b.cs_suggested_price)}</span>
                    ) : (
                      inr(b.cs_suggested_price)
                    )}
                  </td>
                  <td className="num">
                    {pending ? (
                      <span className="badge amber">
                        incomplete — {pending} part{pending > 1 ? "s" : ""} need rates
                      </span>
                    ) : saleable ? (
                      <>
                        {inr(current)}{" "}
                        {stale && <span className="badge amber">out of date</span>}
                      </>
                    ) : (
                      <span className="badge blue">internal — feeds parent sheet</span>
                    )}
                  </td>
                  <td>
                    <Link
                      className="btn ghost"
                      href={`/costsheets/${b.id}`}
                      style={{ padding: "5px 10px" }}
                    >
                      Open sheet →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
