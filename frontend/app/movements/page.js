import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";

export const dynamic = "force-dynamic";

const MOVE_STATE = {
  done: ["recorded", "green"],
  assigned: ["reserved", "blue"],
  confirmed: ["waiting stock", "amber"],
  waiting: ["waiting", "amber"],
  draft: ["draft", "gray"],
  cancel: ["cancelled", "red"],
};

function MoveTable({ rows }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Reference</th>
          <th>Item</th>
          <th className="num">Qty</th>
          <th>From → To</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="empty">
              No movements recorded yet.
            </td>
          </tr>
        )}
        {rows.map((m) => {
          const [label, color] = MOVE_STATE[m.state] || [m.state, "gray"];
          return (
            <tr key={m.id}>
              <td className="mono" style={{ fontWeight: 600 }}>
                {m.reference || "—"}
              </td>
              <td>{m.product_id?.[1]}</td>
              <td className="num">{m.product_uom_qty}</td>
              <td style={{ color: "var(--muted)", fontSize: 12.5 }}>
                {m.location_id?.[1]} → {m.location_dest_id?.[1]}
              </td>
              <td>{(m.date || "").slice(0, 16)}</td>
              <td>
                <span className={`badge ${color}`}>{label}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function Movements() {
  const [handoffs, receipts] = await Promise.all([
    searchRead(
      "stock.move",
      [["location_dest_id.usage", "=", "production"]],
      ["reference", "product_id", "product_uom_qty", "location_id", "location_dest_id", "date", "state"],
      { order: "id desc", limit: 100 }
    ),
    searchRead(
      "stock.move",
      [["location_id.usage", "=", "supplier"]],
      ["reference", "product_id", "product_uom_qty", "location_id", "location_dest_id", "date", "state"],
      { order: "id desc", limit: 100 }
    ),
  ]);

  return (
    <Shell
      title="Material Movements"
      crumb="Every physical handoff is a recorded transaction — no more silent stock drains"
    >
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Store → Production Handoffs ({handoffs.length})</h2>
        <MoveTable rows={handoffs} />
      </div>
      <div className="card">
        <h2>Incoming from Vendors ({receipts.length})</h2>
        <MoveTable rows={receipts} />
      </div>
    </Shell>
  );
}
