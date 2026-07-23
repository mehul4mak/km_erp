import Link from "next/link";

// Generic document metadata block — reused across SO / MO / PO / QA / receipts
// so every record exposes who created it, when, its reference and linked docs.
export default function MetaBar({ items = [], links = [] }) {
  const shown = items.filter(
    (i) => i && i.value !== undefined && i.value !== null && i.value !== ""
  );
  return (
    <div className="card metabar">
      <div className="metabar-grid">
        {shown.map((it, i) => (
          <div className="metabar-item" key={i}>
            <div className="metabar-label">{it.label}</div>
            <div className={"metabar-value" + (it.mono ? " mono" : "")}>{it.value}</div>
          </div>
        ))}
      </div>
      {links.length > 0 && (
        <div className="metabar-links">
          <div className="metabar-label">Linked documents</div>
          <div className="metabar-linkrow">
            {links.map((l, i) => (
              <Link key={i} href={l.href} className="metabar-link">
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
