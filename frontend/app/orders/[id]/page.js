import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { callKw, searchRead, inr } from "@/lib/odoo";
import { confirmOrder, sendQuotation } from "@/lib/actions";

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
      "order_line",
    ],
  ]);

  // Documents link via their Origin field: the top-level MO's origin is the
  // SO, a nested sub-assembly MO's origin is its parent MO, and the PO's
  // origin lists the MOs it buys for — so we chase the chain, not the
  // procurement group (each MO gets its own group in Odoo 17).
  const [lines, topMos] = await Promise.all([
    searchRead(
      "sale.order.line",
      [["order_id", "=", soId]],
      ["product_id", "product_uom_qty", "price_unit", "price_subtotal"]
    ),
    searchRead(
      "mrp.production",
      [["origin", "=", so.name]],
      ["name", "product_id", "product_qty", "state"]
    ),
  ]);
  const nestedMos = topMos.length
    ? await searchRead(
        "mrp.production",
        [["origin", "in", topMos.map((m) => m.name)]],
        ["name", "product_id", "product_qty", "state"]
      )
    : [];
  const mos = [...topMos, ...nestedMos];

  const originTerms = [so.name, ...mos.map((m) => m.name)];
  const poDomain = [
    ...Array(originTerms.length - 1).fill("|"),
    ...originTerms.map((t) => ["origin", "like", t]),
  ];
  const pos = await searchRead(
    "purchase.order",
    poDomain,
    ["name", "partner_id", "amount_total", "state", "order_line"]
  );

  const confirm = confirmOrder.bind(null, soId);
  const send = sendQuotation.bind(null, soId);
  const confirmed = ["sale", "done"].includes(so.state);

  return (
    <Shell title={so.name} crumb={`${so.partner_id?.[1]} · ${(so.date_order || "").slice(0, 10)}`}>
      <div className="page-actions">
        <Link href="/orders" className="btn secondary">
          ← All orders
        </Link>
        {so.state === "draft" && (
          <form action={send}>
            <button className="btn secondary">Mark as sent to customer</button>
          </form>
        )}
        {!confirmed && so.state !== "cancel" && (
          <form action={confirm}>
            <button className="btn">Confirm order — start production →</button>
          </form>
        )}
        <StatusBadge state={so.state} />
      </div>
      {!confirmed && so.state !== "cancel" && (
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
          Next step: <b style={{ color: "var(--ink)" }}>Confirm order</b> — this books the sale and
          automatically plans the production jobs and any material purchases below.
        </div>
      )}

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
                      ? "No purchase needed — the required components were already in store."
                      : "Component RFQs are raised automatically on confirmation, only for parts not in stock."}
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
