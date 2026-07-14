import { cookies } from "next/headers";

// Lightweight demo auth for the POC: one factory login, session held in a cookie.
// Swap for a real identity provider before production.
const DEMO_USERS = {
  "owner@kmforge.cloud": { password: "demo1234", name: "Rajesh Gupta", role: "Owner" },
};

const COOKIE = "mw_session";

export function checkLogin(email, password) {
  const u = DEMO_USERS[email?.toLowerCase()?.trim()];
  if (u && u.password === password) return { email, name: u.name, role: u.role };
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
