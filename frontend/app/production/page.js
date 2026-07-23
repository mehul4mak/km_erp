import Link from "next/link";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { searchRead } from "@/lib/odoo";
import { markProductionDone } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function Production({ searchParams }) {
  const mos = await searchRead(
    "mrp.production",
    [],
    [
      "name",
      "product_id",
      "product_qty",
      "state",
      "origin",
      "date_start",
      "components_availability",
      "components_availability_state",
      "qa_gates_passed",
    ],
    { order: "id desc" }
  );

  const availBadge = (m) => {
    if (["done", "cancel"].includes(m.state)) return null;
    const s = m.components_availability_state;
    const label = m.components_availability || s || "—";
    const color = s === "available" ? "green" : s === "late" ? "red" : "amber";
    return <span className={`badge ${color}`}>{label}</span>;
  };

  return (
    <Shell
      title="Production"
      crumb="Material readiness checked live — no more promising dates before checking stock"
    >
      {searchParams?.blocked && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "4px solid var(--bad)" }}>
          <b>Blocked by quality gate:</b> {searchParams.blocked}
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
              <th>QA Gates</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mos.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  No production jobs yet — confirm an order to plan production.
                </td>
              </tr>
            )}
            {mos.map((m) => {
              const done = markProductionDone.bind(null, m.id);
              const open = !["done", "cancel"].includes(m.state);
              return (
                <tr key={m.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    <Link href={`/production/${m.id}`} className="linkcell">{m.name}</Link>
                  </td>
                  <td>{m.product_id?.[1]}</td>
                  <td className="num">{m.product_qty}</td>
                  <td>{m.origin || "—"}</td>
                  <td>{availBadge(m)}</td>
                  <td>
                    {open ? (
                      m.qa_gates_passed ? (
                        <span className="badge green">passed</span>
                      ) : (
                        <Link href="/quality" title="Go to Quality Gates to inspect this job">
                          <span className="badge amber" style={{ cursor: "pointer" }}>
                            inspection due →
                          </span>
                        </Link>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <StatusBadge state={m.state} />
                  </td>
                  <td>
                    {open &&
                      (m.qa_gates_passed ? (
                        <form action={done}>
                          <button
                            className="btn ghost"
                            style={{ padding: "5px 10px" }}
                            title="Close this job"
                          >
                            Mark done
                          </button>
                        </form>
                      ) : (
                        <span
                          style={{ fontSize: 12.5, color: "var(--muted)" }}
                          title="The In-Process and Finished-Goods checks must pass first"
                        >
                          pass QA to close
                        </span>
                      ))}
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
