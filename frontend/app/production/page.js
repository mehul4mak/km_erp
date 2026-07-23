import Link from "next/link";
import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";

export const dynamic = "force-dynamic";

const STAGE_LABEL = {
  planned: "Planned", started: "Started", in_progress: "In Progress",
  finished: "Finished", done: "Done",
};
const STAGE_BADGE = {
  planned: "gray", started: "blue", in_progress: "blue", finished: "amber", done: "green",
};
const NEXT = {
  planned: "Start →", started: "Begin →", in_progress: "Finish →",
  finished: "Close →", done: "View →",
};

export default async function Production({ searchParams }) {
  const mos = await searchRead(
    "mrp.production",
    [],
    [
      "name", "product_id", "product_qty", "state", "km_stage", "origin",
      "components_availability", "components_availability_state", "qa_gates_passed",
    ],
    { order: "id desc" }
  );

  const availBadge = (m) => {
    if (m.km_stage === "done" || m.state === "cancel") return null;
    const s = m.components_availability_state;
    const label = m.components_availability || s || "—";
    const color = s === "available" ? "green" : s === "late" ? "red" : "amber";
    return <span className={`badge ${color}`}>{label}</span>;
  };

  return (
    <Shell
      title="Production"
      crumb="Every job's live stage — Planned → Started → In Progress → Finished → Done"
    >
      {searchParams?.blocked && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "4px solid var(--bad)" }}>
          <b>Blocked:</b> {searchParams.blocked}
        </div>
      )}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Product</th>
              <th className="num">Qty</th>
              <th>Source</th>
              <th>Materials</th>
              <th>Stage</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mos.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No production jobs yet — confirm an order to plan production.
                </td>
              </tr>
            )}
            {mos.map((m) => {
              const stage = m.km_stage || "planned";
              return (
                <tr key={m.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    <Link href={`/production/${m.id}`} className="linkcell">{m.name}</Link>
                  </td>
                  <td>{m.product_id?.[1]}</td>
                  <td className="num">{m.product_qty}</td>
                  <td>{m.origin || "—"}</td>
                  <td>{availBadge(m)}</td>
                  <td><span className={`badge ${STAGE_BADGE[stage]}`}>{STAGE_LABEL[stage]}</span></td>
                  <td>
                    <Link href={`/production/${m.id}`} className="btn ghost" style={{ padding: "5px 10px" }}>
                      {NEXT[stage]}
                    </Link>
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
