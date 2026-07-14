import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkLogin, sessionCookieValue, SESSION_COOKIE, currentUser } from "@/lib/auth";

async function login(formData) {
  "use server";
  const user = checkLogin(formData.get("email"), formData.get("password"));
  if (!user) redirect("/login?error=1");
  cookies().set(SESSION_COOKIE, sessionCookieValue(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}

export default function LoginPage({ searchParams }) {
  if (currentUser()) redirect("/");
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">MixerWorks</div>
            <div className="brand-sub">Manufacturing Cloud</div>
          </div>
        </div>
        <p className="login-sub">
          Sign in to manage costing, orders, production and stock.
        </p>
        {searchParams?.error && (
          <div className="login-error">Invalid email or password.</div>
        )}
        <form action={login}>
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" defaultValue="owner@mixerworks.in" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" placeholder="demo1234" required />
          </div>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
