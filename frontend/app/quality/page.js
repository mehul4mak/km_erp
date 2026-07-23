import Link from "next/link";
import Shell from "@/components/Shell";
import { searchRead, dt } from "@/lib/odoo";
import { setQualityResult } from "@/lib/actions";

export const dynamic = "force-dynamic";

const CP_LABEL = {
  in_process: "In-Process Check",
  final: "Finished-Goods Check",
};

export default async function Quality() {
  const [checks, openNcr, lots] = await Promise.all([
    searchRead(
      "mfg.quality.check",
      [],
      ["production_id", "product_id", "checkpoint", "state", "due", "note", "checked_by", "checked_on", "create_date"],
      { order: "id desc" }
    ),
    searchRead("mfg.ncr", [["state", "=", "open"]], ["id"]),
    searchRead("mrp.production", [["km_lot", "!=", false]], ["id"]),
  ]);

  const passed = checks.filter((c) => c.state === "pass").length;
  const failed = checks.filter((c) => c.state === "fail").length;
  const actioned = passed + failed;
  const passRate = actioned ? Math.round((passed / actioned) * 100) : 100;

  const jobLink = (pid) =>
    pid ? (
      <Link href={`/production/${pid[0]}`} className="linkcell">{pid[1]}</Link>
    ) : (
      "—"
    );

  const pending = checks.filter((c) => c.state === "pending");
  const history = checks.filter((c) => c.state !== "pending");

  return (
    <Shell
      title="Quality Gates"
      crumb="Mandatory checkpoints — a batch cannot be closed until both gates pass"
    >
      <div className="kpi-grid">
        <div className="card kpi accent">
          <div className="kpi-label">QA Pass Rate</div>
          <div className="kpi-value">{passRate}%</div>
          <div className="kpi-hint">{passed} passed · {failed} failed</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Awaiting Inspection</div>
          <div className="kpi-value">{pending.length}</div>
          <div className="kpi-hint">checks due now</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Open NCRs</div>
          <div className="kpi-value" style={{ color: openNcr.length ? "var(--bad)" : "var(--ink)" }}>{openNcr.length}</div>
          <div className="kpi-hint">nonconformances to disposition</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Lots Produced</div>
          <div className="kpi-value">{lots.length}</div>
          <div className="kpi-hint">traceable finished batches</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Awaiting Inspection ({pending.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Product</th>
              <th>Checkpoint</th>
              <th>Raised</th>
              <th>Inspector Notes</th>
              <th style={{ width: 190 }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  Nothing awaiting inspection.
                </td>
              </tr>
            )}
            {pending.map((c) => {
              const moId = c.production_id?.[0];
              const pass = setQualityResult.bind(null, c.id, "pass", moId);
              const fail = setQualityResult.bind(null, c.id, "fail", moId);
              const unlockAt = c.checkpoint === "in_process" ? "In Progress" : "Finished";
              return (
                <tr key={c.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {jobLink(c.production_id)}
                  </td>
                  <td>{c.product_id?.[1]}</td>
                  <td>
                    <span className="badge blue">{CP_LABEL[c.checkpoint]}</span>
                  </td>
                  <td style={{ fontSize: 12.5, color: "var(--muted)" }}>{dt(c.create_date)}</td>
                  {c.due ? (
                    <>
                      <td>
                        <input name="note" placeholder="optional note" form={`qc-${c.id}`} />
                      </td>
                      <td>
                        <form id={`qc-${c.id}`} style={{ display: "flex", gap: 8 }}>
                          <button className="btn" formAction={pass} style={{ background: "var(--ok)" }}>Pass</button>
                          <button className="btn" formAction={fail} style={{ background: "var(--bad)" }}>Fail</button>
                        </form>
                      </td>
                    </>
                  ) : (
                    <td colSpan={2} style={{ color: "var(--muted)", fontSize: 12.5 }}>
                      <span className="badge gray">locked</span> — unlocks when the job reaches <b>{unlockAt}</b>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Inspection History</h2>
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Checkpoint</th>
              <th>Result</th>
              <th>Notes</th>
              <th>By</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  No inspections recorded yet.
                </td>
              </tr>
            )}
            {history.map((c) => (
              <tr key={c.id}>
                <td className="mono">{jobLink(c.production_id)}</td>
                <td>{CP_LABEL[c.checkpoint]}</td>
                <td>
                  <span className={`badge ${c.state === "pass" ? "green" : "red"}`}>
                    {c.state === "pass" ? "Passed" : "Failed"}
                  </span>
                </td>
                <td>{c.note || "—"}</td>
                <td>{c.checked_by?.[1] || "—"}</td>
                <td>{dt(c.checked_on)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
