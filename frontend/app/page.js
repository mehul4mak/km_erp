import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { searchRead, inr } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [orders, mos, pos, components, orderpoints] = await Promise.all([
    searchRead(
      "sale.order",
      [],
      ["name", "partner_id", "amount_total", "state", "date_order"],
      { order: "date_order desc", limit: 8 }
    ),
    searchRead(
      "mrp.production",
      [["state", "not in", ["done", "cancel"]]],
      ["name", "product_id", "product_qty", "state"],
      { limit: 8 }
    ),
    searchRead(
      "purchase.order",
      [["state", "in", ["draft", "sent", "to approve"]]],
      ["name", "partner_id", "amount_total", "state"],
      { limit: 8 }
    ),
    searchRead(
      "product.product",
      [["detailed_type", "=", "product"], ["bom_ids", "=", false]],
      ["virtual_available"]
    ),
    searchRead("stock.warehouse.orderpoint", [], ["product_id", "product_min_qty"]),
  ]);

  const openOrders = orders.filter((o) => ["sale", "done"].includes(o.state));
  const pipeline = orders.filter((o) => ["draft", "sent"].includes(o.state));
  const orderValue = openOrders.reduce((s, o) => s + o.amount_total, 0);

  // Same rule as the Inventory health column: a bought-in component is due
  // for reorder when its forecast falls below its min/max reorder minimum.
  const minOf = Object.fromEntries(orderpoints.map((o) => [o.product_id[0], o.product_min_qty]));
  const lowStock = components.filter(
    (p) => minOf[p.id] !== undefined && p.virtual_available < minOf[p.id]
  );

  return (
    <Shell title="Dashboard" crumb="Factory overview — live from the floor">
      <div className="kpi-grid">
        <div className="card kpi accent">
          <div className="kpi-label">Confirmed Order Value</div>
          <div className="kpi-value">{inr(orderValue)}</div>
          <div className="kpi-hint">{openOrders.length} confirmed orders</div>
        </div>
        <div className="card kpi accent">
          <div className="kpi-label">Quotes in Pipeline</div>
          <div className="kpi-value">{pipeline.length}</div>
          <div className="kpi-hint">awaiting customer confirmation</div>
        </div>
        <div className="card kpi accent">
          <div className="kpi-label">Jobs on the Floor</div>
          <div className="kpi-value">{mos.length}</div>
          <div className="kpi-hint">production orders in progress</div>
        </div>
        <div className="card kpi accent">
          <div className="kpi-label">Purchases Pending</div>
          <div className="kpi-value">{pos.length}</div>
          <div className="kpi-hint">RFQs awaiting confirmation</div>
        </div>
        <div className="card kpi accent">
          <div className="kpi-label">Items to Replenish</div>
          <div className="kpi-value">{lowStock.length}</div>
          <div className="kpi-hint">components below reorder minimum</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>
            Recent Orders
            <Link className="link" href="/orders">
              View all →
            </Link>
          </h2>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th className="num">Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    No orders yet — create your first quote.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} style={{ color: "var(--brand-2)", fontWeight: 600 }}>
                      {o.name}
                    </Link>
                  </td>
                  <td>{o.partner_id?.[1]}</td>
                  <td className="num">{inr(o.amount_total)}</td>
                  <td>
                    <StatusBadge state={o.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>
            On the Production Floor
            <Link className="link" href="/production">
              View all →
            </Link>
          </h2>
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Product</th>
                <th className="num">Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mos.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    Nothing in production right now.
                  </td>
                </tr>
              )}
              {mos.map((m) => (
                <tr key={m.id}>
                  <td className="mono">{m.name}</td>
                  <td>{m.product_id?.[1]}</td>
                  <td className="num">{m.product_qty}</td>
                  <td>
                    <StatusBadge state={m.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
