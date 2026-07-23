import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import MetaBar from "@/components/MetaBar";
import { callKw, searchRead, inr, dt } from "@/lib/odoo";
import { confirmPurchase } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderDetail({ params }) {
  const poId = parseInt(params.id, 10);
  const [po] = await callKw("purchase.order", "read", [
    [poId],
    [
      "name", "partner_id", "amount_untaxed", "amount_tax", "amount_total",
      "state", "origin", "date_order", "date_approve",
      "create_date", "create_uid", "write_date", "write_uid",
    ],
  ]);
  const lines = await searchRead(
    "purchase.order.line",
    [["order_id", "=", poId]],
    ["product_id", "product_qty", "qty_received", "price_unit", "price_subtotal", "date_planned"]
  );

  // Resolve the source manufacturing orders named in Origin so we can link them.
  const originNames = (po.origin || "").split(",").map((s) => s.trim()).filter(Boolean);
  const mos = originNames.length
    ? await searchRead("mrp.production", [["name", "in", originNames]], ["name"])
    : [];
  const links = mos.map((m) => ({ href: `/production/${m.id}`, label: m.name }));

  const confirm = confirmPurchase.bind(null, poId);
  const openState = ["draft", "sent"].includes(po.state);

  return (
    <Shell title={po.name} crumb={`Purchase order · ${po.partner_id?.[1] || ""}`}>
      <div className="page-actions">
        <Link href="/purchasing" className="btn secondary">← All purchase orders</Link>
        {openState && (
          <form action={confirm}>
            <button className="btn">Confirm PO</button>
          </form>
        )}
        <StatusBadge state={po.state} kind="po" />
      </div>

      <MetaBar
        items={[
          { label: "Reference", value: po.name, mono: true },
          { label: "Vendor", value: po.partner_id?.[1] },
          { label: "Status", value: <StatusBadge state={po.state} kind="po" /> },
          { label: "Source", value: po.origin || "—", mono: true },
          { label: "Order date", value: dt(po.date_order) },
          { label: "Confirmed", value: po.date_approve ? dt(po.date_approve) : "—" },
          { label: "Created", value: dt(po.create_date) },
          { label: "Created by", value: po.create_uid?.[1] },
          { label: "Last updated", value: dt(po.write_date) },
          { label: "Total (incl. tax)", value: inr(po.amount_total) },
        ]}
        links={links}
      />

      <div className="card">
        <h2>Order Lines ({lines.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th className="num">Ordered</th>
              <th className="num">Received</th>
              <th className="num">Unit Price</th>
              <th className="num">Subtotal</th>
              <th>Planned</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td>{l.product_id?.[1]}</td>
                <td className="num">{l.product_qty}</td>
                <td className="num">{l.qty_received || 0}</td>
                <td className="num">{inr(l.price_unit)}</td>
                <td className="num">{inr(l.price_subtotal)}</td>
                <td>{(l.date_planned || "").slice(0, 10) || "—"}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>
                Untaxed / Tax / Total
              </td>
              <td className="num" style={{ fontWeight: 800 }}>
                {inr(po.amount_untaxed)} · {inr(po.amount_tax)} · {inr(po.amount_total)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
