"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/actions";

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {user.name} · {user.role}
        </span>
        <div className="avatar">{user.name?.[0] || "U"}</div>
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-head">
            <div className="user-dropdown-name">{user.name}</div>
            <div className="user-dropdown-meta">{user.role}</div>
            <div className="user-dropdown-meta">
              {user.email}
            </div>
            <div className="user-dropdown-org">
              {(user.org || "SLM")} · {(user.site || "Virar")} plant
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="user-dropdown-item" role="menuitem">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
