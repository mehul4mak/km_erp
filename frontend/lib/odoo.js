// Server-side Odoo JSON-RPC client. The browser never talks to Odoo directly:
// all calls go through Next.js server components / server actions using this module.

const ODOO_URL = process.env.ODOO_URL || "http://localhost:8069";
const ODOO_DB = process.env.ODOO_DB || "erp";
const ODOO_LOGIN = process.env.ODOO_LOGIN || "svc_portal";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "";

// Session state lives on globalThis so it survives Next.js dev-mode module
// re-instantiation (each recompile creates a fresh module scope; a plain
// module-level variable would be reset, forcing a ~1.2s re-authenticate).
const g = globalThis;
g.__odooSession = g.__odooSession || { cookie: null, authPromise: null };

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

// Single-flight: parallel callers (e.g. a page's Promise.all of searchReads)
// share one in-flight authenticate instead of each firing their own. Odoo's
// password check is ~1.2s of CPU, and with workers=0 concurrent auths
// serialize — N parallel reads used to mean N x 1.2s before first paint.
function authenticate() {
  if (!g.__odooSession.authPromise) {
    g.__odooSession.authPromise = (async () => {
      const { result, setCookie } = await rpc("/web/session/authenticate", {
        db: ODOO_DB,
        login: ODOO_LOGIN,
        password: ODOO_PASSWORD,
      });
      if (!result || !result.uid) throw new Error("Backend authentication failed");
      if (setCookie) g.__odooSession.cookie = setCookie.split(";")[0];
      return result.uid;
    })().finally(() => {
      g.__odooSession.authPromise = null;
    });
  }
  return g.__odooSession.authPromise;
}

export async function callKw(model, method, args = [], kwargs = {}) {
  if (!g.__odooSession.cookie) await authenticate();
  try {
    const { result } = await rpc(
      "/web/dataset/call_kw",
      { model, method, args, kwargs },
      g.__odooSession.cookie
    );
    return result;
  } catch (e) {
    // Session expired -> re-auth once and retry
    if (e.odoo && /session/i.test(e.message || "")) {
      g.__odooSession.cookie = null;
      await authenticate();
      const { result } = await rpc(
        "/web/dataset/call_kw",
        { model, method, args, kwargs },
        g.__odooSession.cookie
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
