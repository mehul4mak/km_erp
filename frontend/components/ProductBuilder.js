"use client";

import { useState } from "react";
import CostSheetBuilder from "./CostSheetBuilder";

// Create a product: a manufactured item (with a BOM) or a bought/raw part.
export default function ProductBuilder({ components, vendors }) {
  const [mode, setMode] = useState("manufactured");

  return (
    <>
      <input type="hidden" name="mode" value={mode} />

      <div className="field">
        <label>Product type</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={"btn " + (mode === "manufactured" ? "" : "secondary")}
            onClick={() => setMode("manufactured")}
          >
            Manufactured (has a BOM)
          </button>
          <button
            type="button"
            className={"btn " + (mode === "bought" ? "" : "secondary")}
            onClick={() => setMode("bought")}
          >
            Bought / raw part
          </button>
        </div>
      </div>

      <div className="field">
        <label>Product name</label>
        <input name="name" required placeholder="e.g. REMI BLAZE 750W / Motor 30mm / Bush 500" />
      </div>

      {mode === "manufactured" ? (
        <>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontWeight: 500, color: "var(--ink)", marginBottom: 16 }}>
            <input type="checkbox" name="sellable" defaultChecked style={{ width: "auto", marginTop: 3 }} />
            <span>Sold to customers (a <b>finished good</b>). Uncheck for a <b>semi-finished</b> sub-assembly used inside other products.</span>
          </label>

          <CostSheetBuilder components={components} />

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 130 }}>
              <label>Labour / assembly (₹)</label>
              <input name="labour" type="number" step="0.01" min="0" defaultValue="40" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 110 }}>
              <label>Rejection %</label>
              <input name="rejection_pct" type="number" step="0.1" defaultValue="2" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 110 }}>
              <label>Profit %</label>
              <input name="profit_pct" type="number" step="0.1" defaultValue="7" />
            </div>
          </div>
          <div className="field">
            <label>Opening sale price (optional — apply the computed one later)</label>
            <input name="list_price" type="number" step="0.01" min="0" defaultValue="0" />
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <label>Unit cost (₹)</label>
            <input name="cost" type="number" step="0.01" min="0" defaultValue="0" />
          </div>
          <div className="field">
            <label>Vendor (so shortages can be auto-purchased)</label>
            <select name="vendor_id" defaultValue="">
              <option value="">— add later —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <button className="btn">Create product</button>
    </>
  );
}
