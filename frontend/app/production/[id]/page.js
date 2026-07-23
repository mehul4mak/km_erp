import Link from "next/link";
import Shell from "@/components/Shell";
import MetaBar from "@/components/MetaBar";
import StageStepper from "@/components/StageStepper";
import { callKw, searchRead, dt } from "@/lib/odoo";
import {
  markProductionDone, startJob, progressJob, finishJob, setQualityResult,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

const CHECKPOINT = { in_process: "In-Process Check", final: "Finished-Goods Check" };
const STAGE_LABEL = {
  planned: "Planned", started: "Started", in_progress: "In Progress",
  finished: "Finished", done: "Done",
};
const STAGE_BADGE = {
  planned: "gray", started: "blue", in_progress: "blue", finished: "amber", done: "green",
};

export default async function ProductionDetail({ params, searchParams }) {
  const moId = parseInt(params.id, 10);
  const [mo] = await callKw("mrp.production", "read", [
    [moId],
    [
      "name", "product_id", "product_qty", "state", "km_stage", "origin",
      "date_start", "components_availability", "qa_gates_passed",
      "create_date", "create_uid", "write_date",
    ],
  ]);

  const [raws, checks] = await Promise.all([
    searchRead("stock.move", [["raw_material_production_id", "=", moId]],
      ["product_id", "product_uom_qty", "quantity", "state"]),
    searchRead("mfg.quality.check", [["production_id", "=", moId]],
      ["checkpoint", "state", "due", "checked_by", "checked_on", "note"],
      { order: "checkpoint asc" }),
  ]);

  const [sos, pos] = await Promise.all([
    mo.origin ? searchRead("sale.order", [["name", "=", mo.origin]], ["name"]) : [],
    searchRead("purchase.order", [["origin", "like", mo.name]], ["name"]),
  ]);
  const links = [
    ...sos.map((s) => ({ href: `/orders/${s.id}`, label: `Order ${s.name}` })),
    ...pos.map((p) => ({ href: `/purchasing/${p.id}`, label: `PO ${p.name}` })),
  ];

  const stage = mo.km_stage || "planned";
  const passed = (cp) =>
    checks.some((c) => c.checkpoint === cp && c.state === "pass") &&
    !checks.some((c) => c.checkpoint === cp && c.state === "pending");

  // The one action available at the current stage.
  let action = null;
  if (stage === "planned") action = { label: "Start job →", fn: startJob.bind(null, moId) };
  else if (stage === "started") action = { label: "Begin production →", fn: progressJob.bind(null, moId) };
  else if (stage === "in_progress")
    action = { label: "Finish job →", fn: finishJob.bind(null, moId), disabled: !passed("in_process"), hint: "Pass the In-Process check first." };
  else if (stage === "finished")
    action = { label: "Mark done →", fn: markProductionDone.bind(null, moId), disabled: !passed("final"), hint: "Pass the Finished-Goods check first." };

  return (
    <Shell title={mo.name} crumb={`Manufacturing order · ${mo.product_id?.[1] || ""}`}>
      <div className="page-actions">
        <Link href="/production" className="btn secondary">← All production jobs</Link>
        {action && (
          <form action={action.fn}>
            <button className="btn" disabled={action.disabled}>{action.label}</button>
          </form>
        )}
        {action?.disabled && action.hint && (
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{action.hint}</span>
        )}
        <span className={`badge ${STAGE_BADGE[stage]}`}>{STAGE_LABEL[stage]}</span>
      </div>

      {searchParams?.blocked && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "4px solid var(--bad)" }}>
          <b style={{ color: "var(--bad)" }}>Action blocked:</b> {searchParams.blocked}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <StageStepper stage={stage} />
      </div>

      <MetaBar
        items={[
          { label: "Reference", value: mo.name, mono: true },
          { label: "Product", value: mo.product_id?.[1] },
          { label: "Quantity", value: mo.product_qty },
          { label: "Stage", value: STAGE_LABEL[stage] },
          { label: "Source", value: mo.origin || "—", mono: true },
          { label: "Materials", value: mo.components_availability || "—" },
          { label: "Scheduled start", value: dt(mo.date_start) },
          { label: "Created", value: dt(mo.create_date) },
          { label: "Created by", value: mo.create_uid?.[1] },
          { label: "Last updated", value: dt(mo.write_date) },
        ]}
        links={links}
      />

      <div className="grid-2">
        <div className="card">
          <h2>Components ({raws.length})</h2>
          <table>
            <thead>
              <tr><th>Component</th><th className="num">Needed</th><th className="num">Issued</th><th>State</th></tr>
            </thead>
            <tbody>
              {raws.length === 0 && <tr><td colSpan={4} className="empty">No components.</td></tr>}
              {raws.map((r) => (
                <tr key={r.id}>
                  <td>{r.product_id?.[1]}</td>
                  <td className="num">{r.product_uom_qty}</td>
                  <td className="num">{r.quantity || 0}</td>
                  <td>
                    <span className={`badge ${r.state === "assigned" ? "green" : r.state === "done" ? "blue" : "amber"}`}>
                      {r.state === "assigned" ? "reserved" : r.state === "done" ? "consumed" : r.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Quality Gates</h2>
          {checks.map((c) => {
            const name = CHECKPOINT[c.checkpoint] || c.checkpoint;
            if (c.state === "pass") {
              return (
                <div className="qa-gate pass" key={c.id}>
                  <div>
                    <div className="g-name">{name}</div>
                    <div className="g-sub">{c.checked_by?.[1] || "—"} · {dt(c.checked_on)}</div>
                  </div>
                  <span className="badge green">Passed ✓</span>
                </div>
              );
            }
            if (c.due) {
              const pass = setQualityResult.bind(null, c.id, "pass", moId);
              const fail = setQualityResult.bind(null, c.id, "fail", moId);
              return (
                <div className="qa-gate due" key={c.id}>
                  <div>
                    <div className="g-name">{name}</div>
                    <div className="g-sub">
                      inspect the {c.checkpoint === "in_process" ? "running batch" : "finished units"} now
                    </div>
                  </div>
                  <form id={`qc-${c.id}`} className="qa-actions">
                    <input name="note" placeholder="note" form={`qc-${c.id}`} />
                    <button className="btn" formAction={pass} style={{ background: "var(--ok)", padding: "6px 12px" }}>Pass</button>
                    <button className="btn" formAction={fail} style={{ background: "var(--bad)", padding: "6px 12px" }}>Fail</button>
                  </form>
                </div>
              );
            }
            const unlockAt = c.checkpoint === "in_process" ? "In Progress" : "Finished";
            return (
              <div className="qa-gate locked" key={c.id}>
                <div>
                  <div className="g-name">{name}</div>
                  <div className="g-sub">unlocks when the job is {unlockAt}</div>
                </div>
                <span className="badge gray">locked</span>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
