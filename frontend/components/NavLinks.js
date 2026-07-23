"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { section: "Overview" },
  { href: "/", label: "Dashboard", ico: "◧" },
  { href: "/getting-started", label: "Getting Started", ico: "ⓘ" },
  { href: "/customers", label: "Contacts", ico: "☺" },
  { section: "Sales" },
  { href: "/costsheets", label: "Cost Sheets", ico: "₹" },
  { href: "/orders", label: "Orders & Quotes", ico: "▤" },
  { section: "Production" },
  { href: "/production", label: "Production", ico: "⚙" },
  { href: "/can-build", label: "Can I Build?", ico: "◎" },
  { href: "/requisitions", label: "Material Requisition", ico: "◱" },
  { href: "/quality", label: "Quality Gates", ico: "✓" },
  { section: "Procurement — buying in" },
  { href: "/purchasing", label: "Purchasing", ico: "⇄" },
  { href: "/goods-receipt", label: "Goods Receipt", ico: "⇩" },
  { section: "Warehouse — what's in stock" },
  { href: "/inventory", label: "Inventory", ico: "▦" },
  { href: "/movements", label: "Movements", ico: "⇅" },
];

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="nav">
      {LINKS.map((l, i) =>
        l.section ? (
          <div key={i} className="nav-section">
            {l.section}
          </div>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            className={
              (l.href === "/" ? path === "/" : path.startsWith(l.href))
                ? "active"
                : ""
            }
          >
            <span className="ico">{l.ico}</span>
            <span className="nav-label">{l.label}</span>
          </Link>
        )
      )}
    </nav>
  );
}
