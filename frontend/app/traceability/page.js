import Link from "next/link";
import Shell from "@/components/Shell";
import { searchRead, dt } from "@/lib/odoo";

export const dynamic = "force-dynamic";

// ISO 9001 Clause 8.5.2 — every finished batch carries a lot traceable back to
// its job, components, quality gates and the order it fulfilled.
export default async function Traceability() {
  const lots = await searchRead(
    "mrp.production",
    [["km_lot", "!=", false]],
    ["name", "km_lot", "product_id", "product_qty", "origin", "date_finished", "create_date"],
    { order: "id desc" }
  );

  // Map source orders to customers for the audit trail.
  const origins = [...new Set(lots.map((l) => l.origin).filter(Boolean))];
  const orders = origins.length
    ? await searchRead("sale.order", [["name", "in", origins]], ["name", "partner_id"])
    : [];
  const custOf = Object.fromEntries(orders.map((o) => [o.name, o.partner_id?.[1]]));

  return (
    <Shell
      title="Traceability"
      crumb="Every finished batch, lot-numbered and traceable to its job, components and quality record (ISO 9001 · 8.5.2)"
    >
      <div className="card" style={{ marginBottom: 16, background: "#f7fafd" }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          <b style={{ color: "var(--ink)" }}>How to read this:</b> each row is a produced
          batch with its <b>lot number</b>. Open it to reconstruct the full genealogy —
          which order it filled, which components (and quantities) went in, and the
          in-process &amp; finished-goods QA results with inspector and timestamp.
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Lot No.</th>
              <th>Product</th>
              <th className="num">Qty</th>
              <th>Job</th>
              <th>For order</th>
              <th>Customer</th>
              <th>Produced</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  No finished batches yet — close a production job to generate a lot.
                </td>
              </tr>
            )}
            {lots.map((l) => (
              <tr key={l.id}>
                <td className="mono" style={{ fontWeight: 700 }}>{l.km_lot}</td>
                <td>{l.product_id?.[1]}</td>
                <td className="num">{l.product_qty}</td>
                <td className="mono">
                  <Link href={`/production/${l.id}`} className="linkcell">{l.name}</Link>
                </td>
                <td className="mono">{l.origin || "—"}</td>
                <td>{custOf[l.origin] || "—"}</td>
                <td style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {dt(l.date_finished || l.create_date)}
                </td>
                <td>
                  <Link href={`/production/${l.id}`} className="btn ghost" style={{ padding: "5px 10px" }}>
                    Genealogy →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
