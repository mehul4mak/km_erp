"use client";

import { useState } from "react";

let uid = 0;

// Component picker for a new cost sheet: each row is an existing component
// (its rate comes from its own cost) plus a quantity.
export default function CostSheetBuilder({ components }) {
  const [rows, setRows] = useState([{ key: ++uid }]);
  const addRow = () => setRows((r) => [...r, { key: ++uid }]);
  const removeRow = (key) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));

  return (
    <div>
      <label>Components</label>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        {rows.map((row) => (
          <div key={row.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select name="line_product" required defaultValue="" style={{ flex: 1 }}>
              <option value="" disabled>Choose a component…</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — ₹{(c.standard_price || 0).toFixed(2)}
                </option>
              ))}
            </select>
            <input
              name="line_qty"
              type="number"
              min="0"
              step="0.01"
              defaultValue="1"
              required
              style={{ width: 90 }}
              aria-label="Quantity"
            />
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              className="btn secondary"
              style={{ padding: "8px 12px" }}
              disabled={rows.length === 1}
              aria-label="Remove line"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="btn ghost" style={{ padding: "6px 10px" }}>
        + Add another component
      </button>
    </div>
  );
}
