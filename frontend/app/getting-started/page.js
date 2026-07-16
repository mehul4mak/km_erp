import Link from "next/link";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";

// Static guide — no Odoo calls. Explains what KMForge is and how to use it.
export default function GettingStarted() {
  return (
    <Shell
      title="Getting Started"
      crumb="What KMForge does and how to use it — read this first"
    >
      {/* Intro */}
      <div className="card" style={{ marginBottom: 20, borderTop: "3px solid var(--brand-2)" }}>
        <h2 style={{ fontSize: 17 }}>Welcome to KMForge</h2>
        <p style={{ color: "var(--muted)", maxWidth: "70ch", lineHeight: 1.65 }}>
          KMForge is your factory in one place — costing, orders, production, quality and
          stock, all connected. Price a product from its live bill of materials, turn a
          quote into a confirmed order, and watch the manufacturing jobs and material
          purchases get raised for you automatically. This page shows the main workflow and
          what every screen is for.
        </p>
      </div>

      {/* The golden path */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>The main workflow — order to finished goods</h2>
        <div className="flow-steps">
          <span className="flow-step">1 · Cost Sheet</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step">2 · Quote</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step">3 · Confirm order</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step">4 · Production</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step">5 · Quality gates</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step done">6 · Mark done</span>
        </div>
        <p style={{ color: "var(--muted)", maxWidth: "72ch", lineHeight: 1.65 }}>
          Confirming an order in step 3 is the moment everything connects: KMForge reads the
          product&rsquo;s bill of materials and automatically raises the manufacturing job (and
          any sub-assembly jobs, like the motor), then gathers every bought-in part into a
          purchase order to your vendor. You never re-key it.
        </p>
      </div>

      {/* Try it in 5 minutes */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Try it in 5 minutes</h2>
        <ol style={{ margin: "4px 0 0 18px", lineHeight: 1.9, maxWidth: "72ch" }}>
          <li>
            Open <Link href="/costsheets" style={{ color: "var(--brand-2)", fontWeight: 600 }}>Cost Sheets</Link>,
            click a product, adjust the <b>Rejection %</b> or <b>Profit %</b>, hit{" "}
            <b>Recalculate</b>, then <b>Apply</b> to push the price to quotations.
          </li>
          <li>
            Go to <Link href="/orders/new" style={{ color: "var(--brand-2)", fontWeight: 600 }}>Orders &amp; Quotes → New order</Link>,
            pick a customer and product, set a quantity, tick <b>Confirm</b>, and create it.
          </li>
          <li>
            Open <Link href="/production" style={{ color: "var(--brand-2)", fontWeight: 600 }}>Production</Link> —
            your new job is there, with a live <b>Materials</b> readiness badge. Note the nested
            motor job feeding the mixer job.
          </li>
          <li>
            In <Link href="/quality" style={{ color: "var(--brand-2)", fontWeight: 600 }}>Quality Gates</Link>,
            record <span className="badge green">Pass</span> on both checkpoints for that job.
          </li>
          <li>
            Back on Production, <b>Mark done</b> now works. Try it <i>before</i> passing QA and
            you&rsquo;ll see it blocked — quality gates are mandatory.
          </li>
          <li>
            Check <Link href="/inventory" style={{ color: "var(--brand-2)", fontWeight: 600 }}>Inventory</Link> for
            reorder health, and <Link href="/purchasing" style={{ color: "var(--brand-2)", fontWeight: 600 }}>Purchasing</Link> to
            confirm the RFQ that was raised.
          </li>
        </ol>
      </div>

      {/* Page reference */}
      <div className="card">
        <h2>What each screen is for</h2>
        <table>
          <thead>
            <tr>
              <th>Screen</th>
              <th>Use it to</th>
              <th>Solves</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Dashboard</b></td>
              <td>See order value, jobs on the floor, purchases pending and items to replenish at a glance.</td>
              <td><span className="badge blue">Overview</span></td>
            </tr>
            <tr>
              <td><b>Contacts</b></td>
              <td>Add and manage your customers and vendors.</td>
              <td><span className="badge gray">Master data</span></td>
            </tr>
            <tr>
              <td><b>Cost Sheets</b></td>
              <td>Price a product live from its bill of materials; set rejection &amp; profit %, apply to quotes.</td>
              <td><span className="badge gray">Stale Excel sheets</span></td>
            </tr>
            <tr>
              <td><b>Orders &amp; Quotes</b></td>
              <td>Create quotations, confirm them into orders, and see the jobs &amp; purchases they trigger.</td>
              <td><span className="badge gray">Disconnected flow</span></td>
            </tr>
            <tr>
              <td><b>Production</b></td>
              <td>Track manufacturing jobs with live material readiness before you promise a date.</td>
              <td><span className="badge gray">Manual availability checks</span></td>
            </tr>
            <tr>
              <td><b>Can I Build?</b></td>
              <td>Check feasibility for any quantity — walks the whole BOM tree and names the root blocker.</td>
              <td><span className="badge gray">Guesswork planning</span></td>
            </tr>
            <tr>
              <td><b>Material Requisition</b></td>
              <td>Reserve and earmark a job&rsquo;s components from the store (FIFO) before production starts.</td>
              <td><span className="badge gray">Unmarked material</span></td>
            </tr>
            <tr>
              <td><b>Quality Gates</b></td>
              <td>Record mandatory In-Process and Finished-Goods inspections; a fail re-opens the gate.</td>
              <td><span className="badge gray">Skippable QA</span></td>
            </tr>
            <tr>
              <td><b>Inventory</b></td>
              <td>Watch on-hand, reserved, incoming and forecast stock with min/max reorder health.</td>
              <td><span className="badge gray">No reorder rules</span></td>
            </tr>
            <tr>
              <td><b>Movements</b></td>
              <td>See store→production handoffs and vendor receipts as recorded transactions.</td>
              <td><span className="badge gray">Unrecorded handoffs</span></td>
            </tr>
            <tr>
              <td><b>Purchasing</b></td>
              <td>Confirm the RFQs that orders raise into purchase orders to your vendors.</td>
              <td><span className="badge gray">Manual procurement</span></td>
            </tr>
            <tr>
              <td><b>Goods Receipt</b></td>
              <td>Inspect every vendor delivery (GRN); only an accepted lot can be received into the store.</td>
              <td><span className="badge gray">Uninspected inward stock</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 18 }}>
        Demo sign-in: <b>owner@kmforge.cloud</b> / <b>demo1234</b> · KMForge by KMatrix AI
      </p>
    </Shell>
  );
}
