import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { callKw, searchRead, inr } from "@/lib/odoo";
import { confirmOrder } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }) {
  const soId = parseInt(params.id, 10);
  const [so] = await callKw("sale.order", "read", [
    [soId],
    [
      "name",
      "partner_id",
      "amount_total",
      "state",
      "date_order",
      "client_order_ref",
      "procurement_group_id",
      "order_line",
    ],
  ]);

  const [lines, mos, pos] = await Promise.all([
    searchRead(
      "sale.order.line",
      [["order_id", "=", soId]],
      ["product_id", "product_uom_qty", "price_unit", "price_subtotal"]
    ),
    so.procurement_group_id
      ? searchRead(
          "mrp.production",
          [["procurement_group_id", "=", so.procurement_group_id[0]]],
          ["name", "product_id", "product_qty", "state"]
        )
      : [],
    searchRead(
      "purchase.order",
      [["origin", "like", so.name]],
      ["name", "partner_id", "amount_total", "state", "order_line"]
    ),
  ]);

  const confirm = confirmOrder.bind(null, soId);
  const confirmed = ["sale", "done"].includes(so.state);

  return (
    <Shell title={so.name} crumb={`${so.partner_id?.[1]} · ${(so.date_order || "").slice(0, 10)}`}>
      <div className="page-actions">
        <Link href="/orders" className="btn secondary">
          ← All orders
        </Link>
        {!confirmed && so.state !== "cancel" && (
          <form action={confirm}>
            <button className="btn">Confirm order — start production</button>
          </form>
        )}
        <StatusBadge state={so.state} />
      </div>

      <div className="flow-steps">
        <span className={`flow-step ${so.state !== "cancel" ? "done" : ""}`}>1 · Quotation</span>
        <span className="flow-arrow">→</span>
        <span className={`flow-step ${confirmed ? "done" : ""}`}>2 · Order confirmed</span>
        <span className="flow-arrow">→</span>
        <span className={`flow-step ${mos.length ? "done" : ""}`}>3 · Production planned</span>
        <span className="flow-arrow">→</span>
        <span className={`flow-step ${pos.length ? "done" : ""}`}>4 · Materials ordered</span>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Order Lines</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Qty</th>
              <th className="num">Unit Price</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td>{l.product_id?.[1]}</td>
                <td className="num">{l.product_uom_qty}</td>
                <td className="num">{inr(l.price_unit)}</td>
                <td className="num">{inr(l.price_subtotal)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} style={{ fontWeight: 700, textAlign: "right" }}>
                Total
              </td>
              <td className="num" style={{ fontWeight: 800 }}>
                {inr(so.amount_total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Production Jobs for this Order</h2>
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
                    {confirmed
                      ? "No production jobs generated."
                      : "Confirm the order to plan production automatically."}
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

        <div className="card">
          <h2>Material Purchases for this Order</h2>
          <table>
            <thead>
              <tr>
                <th>PO</th>
                <th>Vendor</th>
                <th className="num">Lines</th>
                <th className="num">Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pos.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    {confirmed
                      ? "No purchases raised for this order."
                      : "Component RFQs are raised automatically on confirmation."}
                  </td>
                </tr>
              )}
              {pos.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.name}</td>
                  <td>{p.partner_id?.[1]}</td>
                  <td className="num">{p.order_line?.length || 0}</td>
                  <td className="num">{inr(p.amount_total)}</td>
                  <td>
                    <StatusBadge state={p.state} kind="po" />
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
