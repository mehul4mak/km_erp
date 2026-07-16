"use client";

import { useState } from "react";

let uid = 0;

export default function QuoteBuilder({ products }) {
  const [rows, setRows] = useState([{ key: ++uid }]);

  const addRow = () => setRows((r) => [...r, { key: ++uid }]);
  const removeRow = (key) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));

  return (
    <div>
      <label>Products</label>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        {rows.map((row, i) => (
          <div key={row.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select name="line_product" required defaultValue="" style={{ flex: 1 }}>
              <option value="" disabled>Choose a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              name="line_qty"
              type="number"
              min="1"
              defaultValue="10"
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
              title={rows.length === 1 ? "At least one line is required" : "Remove line"}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="btn ghost" style={{ padding: "6px 10px" }}>
        + Add another product
      </button>
    </div>
  );
}
