import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";
import { reserveForJob } from "@/lib/actions";

export const dynamic = "force-dynamic";

const MOVE_STATE = {
  assigned: ["reserved for this job", "green"],
  partially_available: ["partly reserved", "amber"],
  confirmed: ["awaiting stock", "amber"],
  waiting: ["awaiting stock", "amber"],
  draft: ["draft", "gray"],
  done: ["issued", "blue"],
};

export default async function Requisitions() {
  const mos = await searchRead(
    "mrp.production",
    [["state", "not in", ["done", "cancel"]]],
    ["name", "product_id", "product_qty", "origin", "reservation_state", "components_availability"],
    { order: "id desc" }
  );
  const moIds = mos.map((m) => m.id);
  const raws = moIds.length
    ? await searchRead(
        "stock.move",
        [["raw_material_production_id", "in", moIds]],
        ["product_id", "product_uom_qty", "state", "raw_material_production_id"],
        { order: "id asc" }
      )
    : [];
  const rawsOf = {};
  for (const r of raws) {
    const k = r.raw_material_production_id[0];
    (rawsOf[k] = rawsOf[k] || []).push(r);
  }

  const resBadge = (s) => {
    const map = {
      assigned: ["fully reserved", "green"],
      confirmed: ["awaiting stock", "amber"],
      waiting: ["awaiting stock", "amber"],
      partially_available: ["partly reserved", "amber"],
    };
    const [l, c] = map[s] || [s || "—", "gray"];
    return <span className={`badge ${c}`}>{l}</span>;
  };

  return (
    <Shell
      title="Material Requisition"
      crumb="Production requests components for a job; the store reserves them (FIFO) and marks them aside"
    >
      <div className="card" style={{ marginBottom: 16, background: "#f7fafd" }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          <b style={{ color: "var(--ink)" }}>How it works:</b>{" "}
          Each manufacturing job carries its component list straight from the BOM. The store
          manager <b>reserves</b> the required materials against the job — FIFO from stock on hand —
          so they&rsquo;re earmarked for <i>this</i> production and can&rsquo;t be consumed elsewhere.
          Components only reserve once they&rsquo;ve been received into the store.
        </div>
      </div>

      {mos.length === 0 && (
        <div className="card"><div className="empty">No open manufacturing jobs.</div></div>
      )}

      {mos.map((m) => {
        const rows = rawsOf[m.id] || [];
        const reserve = reserveForJob.bind(null, m.id);
        return (
          <div className="card" key={m.id} style={{ marginBottom: 16 }}>
            <h2>
              <span>
                <span className="mono" style={{ fontWeight: 700 }}>{m.name}</span>{" "}
                — {m.product_id?.[1]} × {m.product_qty}
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {resBadge(m.reservation_state)}
                {m.reservation_state !== "assigned" && (
                  <form action={reserve}>
                    <button className="btn" style={{ padding: "6px 14px" }}>
                      Reserve materials
                    </button>
                  </form>
                )}
              </span>
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th className="num">Required</th>
                  <th>Reservation</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="empty">No components.</td></tr>
                )}
                {rows.map((r) => {
                  const [label, color] = MOVE_STATE[r.state] || [r.state, "gray"];
                  return (
                    <tr key={r.id}>
                      <td>{r.product_id?.[1]}</td>
                      <td className="num">{r.product_uom_qty}</td>
                      <td><span className={`badge ${color}`}>{label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </Shell>
  );
}
