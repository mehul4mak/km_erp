import Shell from "@/components/Shell";
import { searchRead, inr } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export default async function Inventory() {
  const [products, orderpoints, bomLines] = await Promise.all([
    searchRead(
      "product.product",
      [["detailed_type", "=", "product"]],
      [
        "name",
        "qty_available",
        "free_qty",
        "incoming_qty",
        "virtual_available",
        "standard_price",
        "bom_ids",
      ],
      { order: "name asc" }
    ),
    searchRead(
      "stock.warehouse.orderpoint",
      [],
      ["product_id", "product_min_qty", "product_max_qty"]
    ),
    // every product that appears as a component in some BOM
    searchRead("mrp.bom.line", [], ["product_id"]),
  ]);
  const minOf = Object.fromEntries(
    orderpoints.map((o) => [o.product_id[0], o.product_min_qty])
  );
  // A product is a component-of-something if it is used inside another BOM.
  const usedAsComponent = new Set(bomLines.map((l) => l.product_id[0]));

  const made = products.filter((p) => (p.bom_ids || []).length > 0);
  // Finished good: made in-house and NOT consumed by any other product.
  const finished = made.filter((p) => !usedAsComponent.has(p.id));
  // Semi-finished (sub-assembly): made in-house AND used inside another BOM.
  const semiFinished = made.filter((p) => usedAsComponent.has(p.id));
  // Raw / bought-in: purchased, no BOM of its own.
  const components = products.filter((p) => (p.bom_ids || []).length === 0);

  const health = (p) => {
    const min = minOf[p.id];
    if (p.virtual_available < 0)
      return <span className="badge red">shortage — replenishment queued</span>;
    if (min !== undefined && p.virtual_available < min)
      return <span className="badge amber">below min {min} — reorder due</span>;
    if (p.qty_available <= 0)
      return <span className="badge gray">none on hand</span>;
    return <span className="badge green">ok</span>;
  };

  const Section = ({ title, desc, tag, tagColor, rows, showMin }) => (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2>
        <span>
          {title}{" "}
          {tag && <span className={`badge ${tagColor}`} style={{ marginLeft: 6 }}>{tag}</span>}
        </span>
      </h2>
      {desc && (
        <div style={{ color: "var(--muted)", fontSize: 12.5, margin: "-6px 0 12px" }}>{desc}</div>
      )}
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th className="num">On Hand</th>
            <th className="num">Reserved</th>
            <th className="num">Incoming</th>
            <th className="num">Forecast</th>
            {showMin && <th className="num">Min</th>}
            <th className="num">Unit Cost</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td className="num">{p.qty_available}</td>
              <td className="num">
                {Math.max(0, +(p.qty_available - p.free_qty).toFixed(2))}
              </td>
              <td className="num">{p.incoming_qty}</td>
              <td className="num">{p.virtual_available}</td>
              {showMin && <td className="num">{minOf[p.id] ?? "—"}</td>}
              <td className="num">{inr(p.standard_price)}</td>
              <td>{health(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Shell
      title="Inventory"
      crumb="On-hand, reserved and forecast — with automatic min/max reorder rules"
    >
      <Section
        title={`Finished Goods (${finished.length})`}
        desc="Made in-house and sold to customers — the end product."
        tag="sellable"
        tagColor="green"
        rows={finished}
        showMin={false}
      />
      <Section
        title={`Semi-Finished / Sub-assemblies (${semiFinished.length})`}
        desc="Made in-house but consumed inside another product — not sold on their own (e.g. the motor)."
        tag="not sold separately"
        tagColor="blue"
        rows={semiFinished}
        showMin={false}
      />
      <Section
        title={`Raw / Bought-in Components (${components.length})`}
        desc="Purchased from vendors — the parts that go into everything above."
        tag="purchased"
        tagColor="gray"
        rows={components}
        showMin={true}
      />
    </Shell>
  );
}
