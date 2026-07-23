import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import MetaBar from "@/components/MetaBar";
import { callKw, searchRead, inr, dt } from "@/lib/odoo";
import { markProductionDone } from "@/lib/actions";

export const dynamic = "force-dynamic";

const CHECKPOINT = { in_process: "In-Process Check", final: "Finished-Goods Check" };
const QA_BADGE = { pass: "green", fail: "red", pending: "amber" };
const QA_LABEL = { pass: "Passed", fail: "Failed", pending: "Pending" };

export default async function ProductionDetail({ params, searchParams }) {
  const moId = parseInt(params.id, 10);
  const [mo] = await callKw("mrp.production", "read", [
    [moId],
    [
      "name", "product_id", "product_qty", "state", "origin",
      "date_start", "date_finished", "components_availability",
      "qa_gates_passed", "create_date", "create_uid", "write_date",
    ],
  ]);

  const [raws, checks] = await Promise.all([
    searchRead(
      "stock.move",
      [["raw_material_production_id", "=", moId]],
      ["product_id", "product_uom_qty", "quantity", "state"]
    ),
    searchRead(
      "mfg.quality.check",
      [["production_id", "=", moId]],
      ["checkpoint", "state", "checked_by", "checked_on", "note", "create_date"],
      { order: "checkpoint asc" }
    ),
  ]);

  // Linked source order + purchase orders raised for this job.
  const [sos, pos] = await Promise.all([
    mo.origin ? searchRead("sale.order", [["name", "=", mo.origin]], ["name"]) : [],
    searchRead("purchase.order", [["origin", "like", mo.name]], ["name", "partner_id"]),
  ]);
  const links = [
    ...sos.map((s) => ({ href: `/orders/${s.id}`, label: `Order ${s.name}` })),
    ...pos.map((p) => ({ href: `/purchasing/${p.id}`, label: `PO ${p.name}` })),
  ];

  const done = markProductionDone.bind(null, moId);
  const open = !["done", "cancel"].includes(mo.state);

  return (
    <Shell title={mo.name} crumb={`Manufacturing order · ${mo.product_id?.[1] || ""}`}>
      <div className="page-actions">
        <Link href="/production" className="btn secondary">← All production jobs</Link>
        {open && mo.qa_gates_passed && (
          <form action={done}>
            <button className="btn">Mark done</button>
          </form>
        )}
        {open && !mo.qa_gates_passed && (
          <Link href="/quality" className="btn secondary">Inspect (QA) →</Link>
        )}
        <StatusBadge state={mo.state} />
      </div>

      {searchParams?.blocked && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "4px solid var(--bad)" }}>
          <b style={{ color: "var(--bad)" }}>Blocked by quality gate:</b> {searchParams.blocked}
        </div>
      )}

      <MetaBar
        items={[
          { label: "Reference", value: mo.name, mono: true },
          { label: "Product", value: mo.product_id?.[1] },
          { label: "Quantity", value: mo.product_qty },
          { label: "Status", value: <StatusBadge state={mo.state} /> },
          { label: "Source", value: mo.origin || "—", mono: true },
          { label: "Materials", value: mo.components_availability || "—" },
          { label: "QA gates", value: mo.qa_gates_passed ? "Passed" : "Pending" },
          { label: "Scheduled start", value: dt(mo.date_start) },
          { label: "Created", value: dt(mo.create_date) },
          { label: "Created by", value: mo.create_uid?.[1] },
          { label: "Last updated", value: dt(mo.write_date) },
        ]}
        links={links}
      />

      <div className="grid-2">
        <div className="card">
          <h2>Components required ({raws.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th className="num">Needed</th>
                <th className="num">Reserved</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {raws.length === 0 && (
                <tr><td colSpan={4} className="empty">No components.</td></tr>
              )}
              {raws.map((r) => (
                <tr key={r.id}>
                  <td>{r.product_id?.[1]}</td>
                  <td className="num">{r.product_uom_qty}</td>
                  <td className="num">{r.quantity || 0}</td>
                  <td>
                    <span className={`badge ${r.state === "assigned" ? "green" : "amber"}`}>
                      {r.state === "assigned" ? "reserved" : r.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Quality Gates ({checks.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Checkpoint</th>
                <th>Result</th>
                <th>Inspector</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {checks.length === 0 && (
                <tr><td colSpan={4} className="empty">No checks raised.</td></tr>
              )}
              {checks.map((c) => (
                <tr key={c.id}>
                  <td>{CHECKPOINT[c.checkpoint] || c.checkpoint}</td>
                  <td>
                    <span className={`badge ${QA_BADGE[c.state] || "gray"}`}>
                      {QA_LABEL[c.state] || c.state}
                    </span>
                  </td>
                  <td>{c.checked_by?.[1] || "—"}</td>
                  <td>{c.checked_on ? dt(c.checked_on) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
