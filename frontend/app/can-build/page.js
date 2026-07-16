import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";

export const dynamic = "force-dynamic";

// "Can I build this?" — multi-level BOM explosion with root-cause pegging.
// Walks the product's BOM tree against live free stock and answers:
// what's ready, which sub-assemblies need their own job, and which raw
// material at the very bottom is the real blocker.

export default async function CanBuild({ searchParams }) {
  // Three bulk reads, then everything is computed in memory (no N+1 calls).
  const [products, boms, lines] = await Promise.all([
    searchRead(
      "product.product",
      [["detailed_type", "=", "product"]],
      ["name", "free_qty", "bom_ids", "uom_id"]
    ),
    searchRead("mrp.bom", [], ["product_tmpl_id", "product_qty", "bom_line_ids"]),
    searchRead("mrp.bom.line", [], ["bom_id", "product_id", "product_qty"]),
  ]);

  const prodById = Object.fromEntries(products.map((p) => [p.id, p]));
  const bomById = Object.fromEntries(boms.map((b) => [b.id, b]));
  const linesByBom = {};
  for (const l of lines) (linesByBom[l.bom_id[0]] = linesByBom[l.bom_id[0]] || []).push(l);

  const makeable = products
    .filter((p) => (p.bom_ids || []).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const productId = parseInt(searchParams?.product, 10) || null;
  const qty = Math.max(1, parseFloat(searchParams?.qty) || 10);
  const chosen = productId ? prodById[productId] : null;

  // ---- BOM explosion with pegging ------------------------------------------
  // Returns a tree node; collects root causes (leaf shortages) and sub-MO hints.
  const rootCauses = {}; // productId -> { product, short }
  const subMoHints = []; // { product, buildQty }

  function explode(product, needed, depth) {
    const free = Math.max(0, product.free_qty || 0);
    const fromStock = Math.min(free, needed);
    const short = +(needed - fromStock).toFixed(2);
    const bomId = (product.bom_ids || [])[0];
    const node = {
      id: product.id, name: product.name, needed, free, short, depth,
      isSub: !!bomId && depth > 0, children: [],
    };
    if (short <= 0) return node; // fully coverable from stock — stop here

    if (bomId && bomById[bomId]) {
      // Semi-finished: the shortfall must be BUILT -> its own MO, explode deeper
      if (depth > 0) subMoHints.push({ product, buildQty: short });
      const bom = bomById[bomId];
      const batch = bom.product_qty || 1;
      for (const l of linesByBom[bomId] || []) {
        const child = prodById[l.product_id[0]];
        if (!child) continue;
        node.children.push(explode(child, +((l.product_qty * short) / batch).toFixed(2), depth + 1));
      }
    } else if (depth > 0) {
      // Raw material shortage — this is a root cause
      const rc = (rootCauses[product.id] = rootCauses[product.id] || { product, short: 0 });
      rc.short = +(rc.short + short).toFixed(2);
    }
    return node;
  }

  let tree = null;
  if (chosen) tree = explode(chosen, qty, 0);
  const causes = Object.values(rootCauses);
  const blocked = tree && (causes.length > 0 || tree.short > 0 && tree.children.length === 0);
  const buildable = tree && causes.length === 0;

  const StatusBadge = ({ n }) => {
    if (n.depth === 0)
      return null;
    if (n.short <= 0)
      return <span className="badge green">in store ✓</span>;
    if (n.isSub)
      return <span className="badge blue">build {n.short} (needs its own job)</span>;
    return <span className="badge red">SHORT {n.short} ◀ root cause</span>;
  };

  const Row = ({ n }) => (
    <>
      <tr style={n.depth > 0 && n.short > 0 && !n.isSub ? { background: "#fdeaea55" } : undefined}>
        <td>
          <span style={{ paddingLeft: n.depth * 26, color: n.depth ? undefined : "var(--ink)" }}>
            {n.depth > 0 && <span style={{ color: "var(--muted)", marginRight: 6 }}>{"└"}</span>}
            <b style={{ fontWeight: n.depth === 0 || n.isSub ? 700 : 500 }}>{n.name}</b>
          </span>
        </td>
        <td className="num">{n.needed}</td>
        <td className="num">{n.free}</td>
        <td><StatusBadge n={n} /></td>
      </tr>
      {n.children.map((c) => <Row key={`${c.id}-${c.depth}-${c.needed}`} n={c} />)}
    </>
  );

  return (
    <Shell
      title="Can I Build This?"
      crumb="Explodes the full BOM against live stock and points at the root blocker — even three levels down"
    >
      <div className="card" style={{ marginBottom: 16 }}>
        <form method="get" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0, minWidth: 320 }}>
            <label>Product to build</label>
            <select name="product" defaultValue={productId || ""} required>
              <option value="" disabled>Choose a product…</option>
              {makeable.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0, width: 110 }}>
            <label>Quantity</label>
            <input name="qty" type="number" min="1" defaultValue={qty} />
          </div>
          <button className="btn">Check feasibility</button>
        </form>
      </div>

      {tree && (
        <>
          <div
            className="card"
            style={{
              marginBottom: 16,
              borderLeft: `4px solid ${buildable ? "var(--ok)" : "var(--bad)"}`,
            }}
          >
            {buildable ? (
              <div>
                <b style={{ color: "var(--ok)", fontSize: 15 }}>
                  ✓ You can build {qty} × {chosen.name}.
                </b>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                  {subMoHints.length > 0
                    ? <>Everything is coverable — but {subMoHints.map((h, i) => (
                        <span key={h.product.id}>{i > 0 && ", "}<b>{h.buildQty} × {h.product.name}</b> must be built first (its own production job)</span>
                      ))}, and its materials are in store.</>
                    : "All materials are in store and unreserved."}
                </div>
              </div>
            ) : (
              <div>
                <b style={{ color: "var(--bad)", fontSize: 15 }}>
                  ✗ Cannot build {qty} × {chosen.name} yet.
                </b>
                <div style={{ marginTop: 8, fontSize: 13.5 }}>
                  <b>Root cause{causes.length > 1 ? "s" : ""} — fix {causes.length > 1 ? "these" : "this"} and the whole chain unblocks:</b>
                  <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.8 }}>
                    {causes.map((c) => (
                      <li key={c.product.id}>
                        Buy <b>{c.short}</b> more of <b>{c.product.name}</b>{" "}
                        <span style={{ color: "var(--muted)" }}>(free in store: {c.product.free_qty})</span>
                      </li>
                    ))}
                  </ul>
                  {subMoHints.length > 0 && (
                    <div style={{ marginTop: 8, color: "var(--muted)" }}>
                      Then build: {subMoHints.map((h, i) => (
                        <span key={h.product.id}>{i > 0 && " → "}<b>{h.buildQty} × {h.product.name}</b></span>
                      ))} → then {chosen.name}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Full breakdown — {qty} × {chosen.name}</h2>
            <table>
              <thead>
                <tr>
                  <th>Item (indent = deeper in the BOM)</th>
                  <th className="num">Needed</th>
                  <th className="num">Free in store</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <Row n={tree} />
              </tbody>
            </table>
            <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 10 }}>
              "Free in store" excludes stock already reserved for other jobs. A semi-finished
              shortage explodes into <i>its</i> materials — the chain ends at the raw material
              that's actually missing.
            </div>
          </div>
        </>
      )}

      {!tree && (
        <div className="card">
          <div className="empty">
            Pick a product and quantity — the system will walk the whole BOM tree
            (mixer → motor → raw parts) and tell you exactly what's blocking it.
          </div>
        </div>
      )}
    </Shell>
  );
}
