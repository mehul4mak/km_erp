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
    ["list_price"]
  );
  const priceOf = Object.fromEntries(tmpls.map((t) => [t.id, t.list_price]));

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
              const current = priceOf[b.product_tmpl_id[0]] || 0;
              const stale = Math.abs(current - b.cs_suggested_price) > 0.5;
              return (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.product_tmpl_id[1]}</td>
                  <td className="num">{inr(b.cs_material_cost)}</td>
                  <td className="num">{inr(b.cs_operation_cost)}</td>
                  <td className="num">{b.rejection_pct}%</td>
                  <td className="num">{b.profit_pct}%</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {inr(b.cs_suggested_price)}
                  </td>
                  <td className="num">
                    {inr(current)}{" "}
                    {stale && <span className="badge amber">out of date</span>}
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
