import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";
import { recordInwardResult, receiveToStore } from "@/lib/actions";

export const dynamic = "force-dynamic";

const PICK_STATE = {
  draft: ["draft", "gray"],
  waiting: ["waiting", "amber"],
  confirmed: ["waiting stock", "amber"],
  assigned: ["ready to receive", "blue"],
  done: ["received to store", "green"],
  cancel: ["cancelled", "red"],
};

export default async function GoodsReceipt({ searchParams }) {
  const receipts = await searchRead(
    "stock.picking",
    [["picking_type_id.code", "=", "incoming"]],
    ["name", "partner_id", "origin", "state", "scheduled_date", "move_ids", "inward_qc_passed"],
    { order: "id desc" }
  );
  const pickIds = receipts.map((r) => r.id);
  const checks = pickIds.length
    ? await searchRead("mfg.incoming.check", [["picking_id", "in", pickIds]], ["picking_id", "state"])
    : [];
  // A receipt can carry several checks (a rejection re-opens a fresh pending
  // one), so aggregate per picking instead of keeping only the last row.
  const checksOf = {};
  for (const c of checks) (checksOf[c.picking_id[0]] = checksOf[c.picking_id[0]] || []).push(c.state);

  const qcStatus = (r) => {
    const states = checksOf[r.id] || [];
    if (r.state === "done" || states.includes("pass")) return "accepted";
    if (states.includes("pending"))
      return states.includes("fail") ? "reinspect" : "awaiting";
    return states.includes("fail") ? "held" : "awaiting";
  };

  const inwardBadge = (r) => {
    const st = qcStatus(r);
    if (st === "accepted") return <span className="badge green">accepted</span>;
    if (st === "reinspect") return <span className="badge red">rejected — re-inspection due</span>;
    if (st === "held") return <span className="badge red">rejected — held</span>;
    return <span className="badge amber">awaiting inspection</span>;
  };

  return (
    <Shell
      title="Goods Receipt (GRN)"
      crumb="Vendor deliveries are inspected before they reach the store — a rejected lot never enters stock"
    >
      {searchParams?.blocked && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "4px solid var(--bad)" }}>
          <b>Blocked:</b> {searchParams.blocked}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16, background: "#f7fafd" }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          <b style={{ color: "var(--ink)" }}>The inward flow:</b>{" "}
          Vendor delivers → <b>Goods Receipt Note</b> raised → <b>Inward Quality Inspection</b>{" "}
          (accept / reject the lot) → accepted goods are <b>received into the store</b> (FIFO),
          ready to reserve for production. Receiving is blocked until the lot is accepted.
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>GRN</th>
              <th>Vendor</th>
              <th>Source PO</th>
              <th className="num">Items</th>
              <th>Inward QC</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {receipts.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No goods receipts yet — confirm a purchase order to raise one.
                </td>
              </tr>
            )}
            {receipts.map((r) => {
              const st = qcStatus(r);
              const done = r.state === "done";
              const pass = recordInwardResult.bind(null, r.id, "pass");
              const fail = recordInwardResult.bind(null, r.id, "fail");
              const receive = receiveToStore.bind(null, r.id);
              const [label, color] = PICK_STATE[r.state] || [r.state, "gray"];
              return (
                <tr key={r.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.partner_id?.[1] || "—"}</td>
                  <td>{r.origin || "—"}</td>
                  <td className="num">{r.move_ids?.length || 0}</td>
                  <td>{inwardBadge(r)}</td>
                  <td><span className={`badge ${color}`}>{label}</span></td>
                  <td>
                    {!done && (st === "awaiting" || st === "reinspect") && (
                      <form style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          name="note"
                          placeholder="inspector note"
                          style={{ width: 150, padding: "5px 9px" }}
                        />
                        <button formAction={pass} className="btn" style={{ padding: "5px 12px", background: "var(--ok)" }}>
                          Accept lot
                        </button>
                        <button formAction={fail} className="btn" style={{ padding: "5px 12px", background: "var(--bad)" }}>
                          Reject
                        </button>
                      </form>
                    )}
                    {!done && st === "accepted" && r.inward_qc_passed && (
                      <form action={receive}>
                        <button className="btn" style={{ padding: "5px 12px" }}>
                          Receive to store →
                        </button>
                      </form>
                    )}
                    {done && <span style={{ fontSize: 12.5, color: "var(--ok)" }}>in store ✓</span>}
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
