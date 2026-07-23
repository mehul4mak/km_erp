import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { searchRead, inr } from "@/lib/odoo";
import { confirmPurchase } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Purchasing() {
  const pos = await searchRead(
    "purchase.order",
    [],
    ["name", "partner_id", "amount_total", "state", "origin", "order_line"],
    { order: "id desc" }
  );

  return (
    <Shell
      title="Purchasing"
      crumb="Ordering components from vendors — confirm the RFQs raised automatically when stock is short"
    >
      <div className="page-actions">
        <Link href="/purchasing/new" className="btn">
          + New purchase order
        </Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>PO</th>
              <th>Vendor</th>
              <th>Source</th>
              <th className="num">Lines</th>
              <th className="num">Value</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pos.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No purchase orders yet.
                </td>
              </tr>
            )}
            {pos.map((p) => {
              const confirm = confirmPurchase.bind(null, p.id);
              return (
                <tr key={p.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {p.name}
                  </td>
                  <td>{p.partner_id?.[1]}</td>
                  <td>{p.origin || "—"}</td>
                  <td className="num">{p.order_line?.length || 0}</td>
                  <td className="num">{inr(p.amount_total)}</td>
                  <td>
                    <StatusBadge state={p.state} kind="po" />
                  </td>
                  <td>
                    {["draft", "sent"].includes(p.state) && (
                      <form action={confirm}>
                        <button className="btn ghost" style={{ padding: "5px 10px" }}>
                          Confirm PO
                        </button>
                      </form>
                    )}
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
