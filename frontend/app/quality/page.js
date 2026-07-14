import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";
import { setQualityResult } from "@/lib/actions";

export const dynamic = "force-dynamic";

const CP_LABEL = {
  in_process: "In-Process Check",
  final: "Finished-Goods Check",
};

export default async function Quality() {
  const checks = await searchRead(
    "mfg.quality.check",
    [],
    ["production_id", "product_id", "checkpoint", "state", "note", "checked_by", "checked_on"],
    { order: "id desc" }
  );

  const pending = checks.filter((c) => c.state === "pending");
  const history = checks.filter((c) => c.state !== "pending");

  return (
    <Shell
      title="Quality Gates"
      crumb="Mandatory checkpoints — a batch cannot be closed until both gates pass"
    >
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Awaiting Inspection ({pending.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Product</th>
              <th>Checkpoint</th>
              <th>Inspector Notes</th>
              <th style={{ width: 190 }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  Nothing awaiting inspection.
                </td>
              </tr>
            )}
            {pending.map((c) => {
              const pass = setQualityResult.bind(null, c.id, "pass");
              const fail = setQualityResult.bind(null, c.id, "fail");
              return (
                <tr key={c.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {c.production_id?.[1]}
                  </td>
                  <td>{c.product_id?.[1]}</td>
                  <td>
                    <span className="badge blue">{CP_LABEL[c.checkpoint]}</span>
                  </td>
                  <td>
                    <form action={pass} id={`pass-${c.id}`} />
                    <form action={fail} id={`fail-${c.id}`} />
                    <input name="note" placeholder="optional note" form={`pass-${c.id}`} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" form={`pass-${c.id}`} style={{ background: "var(--ok)" }}>
                        Pass
                      </button>
                      <button className="btn" form={`fail-${c.id}`} style={{ background: "var(--bad)" }}>
                        Fail
                      </button>
                    </div>
                  </td>
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
                <td className="mono">{c.production_id?.[1]}</td>
                <td>{CP_LABEL[c.checkpoint]}</td>
                <td>
                  <span className={`badge ${c.state === "pass" ? "green" : "red"}`}>
                    {c.state === "pass" ? "Passed" : "Failed"}
                  </span>
                </td>
                <td>{c.note || "—"}</td>
                <td>{c.checked_by?.[1] || "—"}</td>
                <td>{(c.checked_on || "").slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
