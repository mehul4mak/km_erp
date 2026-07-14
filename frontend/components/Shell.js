import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import NavLinks from "./NavLinks";

export default function Shell({ title, crumb, children }) {
  const user = currentUser();
  if (!user) redirect("/login");
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <div className="brand-mark">KM</div>
          <div>
            <div className="brand-name">KMForge</div>
            <div className="brand-sub">Manufacturing Cloud</div>
          </div>
        </Link>
        <NavLinks />
        <div className="sidebar-foot">
          Plant: Delhi NCR Unit 1<br />v1.0 · KMForge · by KMatrix AI
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            {crumb && <div className="crumb">{crumb}</div>}
          </div>
          <div className="user-chip">
            <span>
              {user.name} · {user.role}
            </span>
            <div className="avatar">{user.name?.[0] || "U"}</div>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
