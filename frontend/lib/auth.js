import { cookies } from "next/headers";

// Lightweight demo auth for the POC: one factory login, session held in a cookie.
// The real model is multi-tenant — Org (tenant) → Site/Plant → User+Role — so the
// session carries org/site/role, not just a name. A full RBAC directory (many
// sites, many roles per org) is Phase 5; here we seed one realistic identity.
// Swap for a real identity provider before production.
const DEMO_USERS = {
  "vishal.m@slm.co": {
    password: "slm1234",
    name: "Vishal M",
    role: "Plant Manager",
    org: "SLM",
    site: "Virar",
  },
};

const COOKIE = "mw_session";

export function checkLogin(email, password) {
  const u = DEMO_USERS[email?.toLowerCase()?.trim()];
  if (u && u.password === password)
    return { email, name: u.name, role: u.role, org: u.org, site: u.site };
  return null;
}

export function currentUser() {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function sessionCookieValue(user) {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export const SESSION_COOKIE = COOKIE;
