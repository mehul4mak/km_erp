const MAP = {
  // sale.order
  draft: ["Quotation", "gray"],
  sent: ["Quote Sent", "blue"],
  sale: ["Confirmed", "green"],
  done: ["Done", "green"],
  cancel: ["Cancelled", "red"],
  // mrp.production
  confirmed: ["Planned", "blue"],
  progress: ["In Production", "amber"],
  to_close: ["Finishing", "amber"],
  // purchase.order
  purchase: ["PO Confirmed", "green"],
  "sent-po": ["RFQ Sent", "blue"],
};

export default function StatusBadge({ state, kind }) {
  const key = kind === "po" && state === "sent" ? "sent-po" : state;
  const [label, color] = MAP[key] || [state, "gray"];
  return <span className={`badge ${color}`}>{label}</span>;
}
