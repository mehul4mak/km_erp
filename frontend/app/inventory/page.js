import Shell from "@/components/Shell";
import { searchRead, inr } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export default async function Inventory() {
  const [products, orderpoints] = await Promise.all([
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
  ]);
  const minOf = Object.fromEntries(
    orderpoints.map((o) => [o.product_id[0], o.product_min_qty])
  );

  const finished = products.filter((p) => (p.bom_ids || []).length > 0);
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

  const Section = ({ title, rows, showMin }) => (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2>{title}</h2>
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
        title={`Finished Goods & Sub-assemblies (${finished.length})`}
        rows={finished}
        showMin={false}
      />
      <Section
        title={`Bought-in Components (${components.length})`}
        rows={components}
        showMin={true}
      />
    </Shell>
  );
}
