import Link from "next/link";
import Shell from "@/components/Shell";
import { searchRead, inr } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export default async function Products() {
  const [products, bomLines] = await Promise.all([
    searchRead(
      "product.product",
      [["detailed_type", "=", "product"]],
      ["name", "sale_ok", "purchase_ok", "bom_ids", "standard_price", "list_price", "qty_available"],
      { order: "name asc" }
    ),
    searchRead("mrp.bom.line", [], ["product_id"]),
  ]);
  const usedAsComponent = new Set(bomLines.map((l) => l.product_id[0]));

  const made = products.filter((p) => (p.bom_ids || []).length > 0);
  const finished = made.filter((p) => !usedAsComponent.has(p.id));
  const semiFinished = made.filter((p) => usedAsComponent.has(p.id));
  const bought = products.filter((p) => (p.bom_ids || []).length === 0);

  const sheetLink = (p) =>
    (p.bom_ids || []).length ? (
      <Link href={`/costsheets/${p.bom_ids[0]}`} className="linkcell">Cost sheet →</Link>
    ) : (
      <span style={{ color: "var(--muted)" }}>—</span>
    );

  const Section = ({ title, desc, tag, tagColor, rows, showPrice }) => (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2>
        <span>
          {title}{" "}
          {tag && <span className={`badge ${tagColor}`} style={{ marginLeft: 6 }}>{tag}</span>}
        </span>
      </h2>
      {desc && <div style={{ color: "var(--muted)", fontSize: 12.5, margin: "-6px 0 12px" }}>{desc}</div>}
      {rows.length === 0 ? (
        <div className="empty">None yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Unit Cost</th>
              {showPrice && <th className="num">Sale Price</th>}
              <th className="num">On Hand</th>
              <th>Costing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td className="num">{inr(p.standard_price)}</td>
                {showPrice && <td className="num">{p.sale_ok ? inr(p.list_price) : "—"}</td>}
                <td className="num">{p.qty_available}</td>
                <td>{sheetLink(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <Shell
      title="Products"
      crumb="Your product master — finished goods, semi-finished sub-assemblies and bought-in parts"
    >
      <div className="page-actions">
        <Link href="/products/new" className="btn">+ New product</Link>
        <Link href="/costsheets" className="btn secondary">Cost sheets →</Link>
      </div>

      <Section
        title={`Finished Goods (${finished.length})`}
        desc="Manufactured in-house and sold to customers."
        tag="sellable" tagColor="green" rows={finished} showPrice={true}
      />
      <Section
        title={`Semi-Finished / Sub-assemblies (${semiFinished.length})`}
        desc="Manufactured in-house but consumed inside another product — not sold on their own."
        tag="not sold separately" tagColor="blue" rows={semiFinished} showPrice={false}
      />
      <Section
        title={`Raw / Bought-in Parts (${bought.length})`}
        desc="Purchased from vendors — the parts that go into everything above."
        tag="purchased" tagColor="gray" rows={bought} showPrice={false}
      />
    </Shell>
  );
}
