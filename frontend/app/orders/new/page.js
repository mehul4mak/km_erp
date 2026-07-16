import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";
import { createQuotation } from "@/lib/actions";
import QuoteBuilder from "@/components/QuoteBuilder";

export const dynamic = "force-dynamic";

export default async function NewQuote({ searchParams }) {
  const [customers, products] = await Promise.all([
    searchRead("res.partner", [["customer_rank", ">", 0]], ["name"], { order: "name asc" }),
    // Only finished, sellable products — sub-assemblies (sale_ok = false) are excluded.
    searchRead(
      "product.product",
      [["sale_ok", "=", true], ["bom_ids", "!=", false]],
      ["name", "list_price"],
      { order: "name asc" }
    ),
  ]);

  return (
    <Shell title="New Quotation" crumb="Add one or more products — prices come from the live cost sheet">
      <div className="card" style={{ maxWidth: 680 }}>
        {searchParams?.error === "empty" && (
          <div className="login-error" style={{ marginBottom: 14 }}>
            Add at least one product line before saving.
          </div>
        )}
        <form action={createQuotation}>
          <div className="field">
            <label>Customer</label>
            <select name="partner_id" required defaultValue="">
              <option value="" disabled>Choose a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <QuoteBuilder products={products} />
          </div>

          <div className="field">
            <label>Customer reference (optional)</label>
            <input name="client_ref" placeholder="e.g. PO-2026-104" />
          </div>

          <button className="btn">Create quotation</button>
          <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 10 }}>
            Saved as a draft quotation — you&rsquo;ll send or confirm it on the next screen.
          </div>
        </form>
      </div>
    </Shell>
  );
}
