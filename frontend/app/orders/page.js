import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { searchRead, inr } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export default async function Orders() {
  const orders = await searchRead(
    "sale.order",
    [],
    ["name", "partner_id", "amount_total", "state", "date_order", "client_order_ref"],
    { order: "date_order desc" }
  );

  return (
    <Shell title="Orders & Quotes" crumb="Every quotation and confirmed order, with live production status">
      <div className="page-actions">
        <Link href="/orders/new" className="btn">
          + New Quotation
        </Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Customer Ref</th>
              <th>Date</th>
              <th className="num">Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  No orders yet.
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
                <td>{o.client_order_ref || "—"}</td>
                <td>{(o.date_order || "").slice(0, 10)}</td>
                <td className="num">{inr(o.amount_total)}</td>
                <td>
                  <StatusBadge state={o.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
