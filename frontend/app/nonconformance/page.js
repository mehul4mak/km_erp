import Link from "next/link";
import Shell from "@/components/Shell";
import { searchRead, dt } from "@/lib/odoo";
import { setNcrDisposition, closeNcr } from "@/lib/actions";

export const dynamic = "force-dynamic";

const CP = { in_process: "In-Process", final: "Finished-Goods" };
const DISPOSITIONS = [
  ["pending", "Awaiting review"],
  ["rework", "Rework"],
  ["scrap", "Scrap"],
  ["use_as_is", "Use as is"],
  ["return_vendor", "Return to vendor"],
];
const DISP_LABEL = Object.fromEntries(DISPOSITIONS);

export default async function Nonconformance() {
  const ncrs = await searchRead(
    "mfg.ncr",
    [],
    ["name", "production_id", "product_id", "checkpoint", "reason", "disposition",
     "root_cause", "corrective_action", "state", "raised_by", "create_date", "closed_by", "closed_on"],
    { order: "create_date desc" }
  );
  const open = ncrs.filter((n) => n.state === "open");
  const closed = ncrs.filter((n) => n.state === "closed");

  return (
    <Shell
      title="Nonconformance (NCR)"
      crumb="A QA failure raises an NCR — record the disposition and corrective action, then close it (ISO 9001 · 8.7 / 10.2)"
    >
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Open NCRs ({open.length})</h2>
        {open.length === 0 ? (
          <div className="empty">No open nonconformances — quality is clean.</div>
        ) : (
          open.map((n) => {
            const save = setNcrDisposition.bind(null, n.id);
            const close = closeNcr.bind(null, n.id);
            return (
              <div key={n.id} className="card" style={{ margin: "0 0 12px", background: "#fffdf8", borderColor: "#f6e0b8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <b className="mono">{n.name}</b>{" "}
                    <span className="badge blue">{CP[n.checkpoint] || n.checkpoint}</span>{" "}
                    <span style={{ color: "var(--muted)", fontSize: 12.5 }}>
                      {n.product_id?.[1]} · raised {dt(n.create_date)} by {n.raised_by?.[1] || "—"}
                    </span>
                  </div>
                  {n.production_id && (
                    <Link href={`/production/${n.production_id[0]}`} className="linkcell mono">
                      {n.production_id[1]} →
                    </Link>
                  )}
                </div>
                {n.reason && (
                  <div style={{ fontSize: 13, marginBottom: 10 }}>
                    <span style={{ color: "var(--muted)" }}>Defect: </span>{n.reason}
                  </div>
                )}
                <form action={save}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div className="field" style={{ flex: 1, minWidth: 180 }}>
                      <label>Disposition</label>
                      <select name="disposition" defaultValue={n.disposition}>
                        {DISPOSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{ flex: 2, minWidth: 220 }}>
                      <label>Root cause</label>
                      <input name="root_cause" defaultValue={n.root_cause || ""} placeholder="5-why / cause" />
                    </div>
                    <div className="field" style={{ flex: 2, minWidth: 220 }}>
                      <label>Corrective / preventive action</label>
                      <input name="corrective_action" defaultValue={n.corrective_action || ""} placeholder="action taken" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn secondary">Save</button>
                    <button className="btn" formAction={close}>Close NCR</button>
                  </div>
                </form>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2>Closed ({closed.length})</h2>
        <table>
          <thead>
            <tr>
              <th>NCR</th><th>Product</th><th>Gate</th><th>Disposition</th>
              <th>Root cause</th><th>Action</th><th>Closed</th>
            </tr>
          </thead>
          <tbody>
            {closed.length === 0 && <tr><td colSpan={7} className="empty">None closed yet.</td></tr>}
            {closed.map((n) => (
              <tr key={n.id}>
                <td className="mono">{n.name}</td>
                <td>{n.product_id?.[1]}</td>
                <td>{CP[n.checkpoint] || n.checkpoint}</td>
                <td><span className="badge gray">{DISP_LABEL[n.disposition] || n.disposition}</span></td>
                <td>{n.root_cause || "—"}</td>
                <td>{n.corrective_action || "—"}</td>
                <td style={{ fontSize: 12.5, color: "var(--muted)" }}>{dt(n.closed_on)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
