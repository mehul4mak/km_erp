// Server-side Odoo JSON-RPC client. The browser never talks to Odoo directly:
// all calls go through Next.js server components / server actions using this module.

const ODOO_URL = process.env.ODOO_URL || "http://localhost:8069";
const ODOO_DB = process.env.ODOO_DB || "erp";
const ODOO_LOGIN = process.env.ODOO_LOGIN || "svc_portal";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "";

let sessionCookie = null;

async function rpc(path, params, cookie) {
  const res = await fetch(`${ODOO_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params }),
    cache: "no-store",
  });
  const setCookie = res.headers.get("set-cookie");
  const body = await res.json();
  if (body.error) {
    const msg =
      body.error.data?.message || body.error.message || "Odoo RPC error";
    const err = new Error(msg);
    err.odoo = body.error;
    throw err;
  }
  return { result: body.result, setCookie };
}

async function authenticate() {
  const { result, setCookie } = await rpc("/web/session/authenticate", {
    db: ODOO_DB,
    login: ODOO_LOGIN,
    password: ODOO_PASSWORD,
  });
  if (!result || !result.uid) throw new Error("Backend authentication failed");
  if (setCookie) sessionCookie = setCookie.split(";")[0];
  return result.uid;
}

export async function callKw(model, method, args = [], kwargs = {}) {
  if (!sessionCookie) await authenticate();
  try {
    const { result } = await rpc(
      "/web/dataset/call_kw",
      { model, method, args, kwargs },
      sessionCookie
    );
    return result;
  } catch (e) {
    // Session expired -> re-auth once and retry
    if (e.odoo && /session/i.test(e.message || "")) {
      sessionCookie = null;
      await authenticate();
      const { result } = await rpc(
        "/web/dataset/call_kw",
        { model, method, args, kwargs },
        sessionCookie
      );
      return result;
    }
    throw e;
  }
}

export function searchRead(model, domain = [], fields = [], kwargs = {}) {
  return callKw(model, "search_read", [domain, fields], kwargs);
}

export const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);
