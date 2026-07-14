import Shell from "@/components/Shell";
import { searchRead, inr } from "@/lib/odoo";
import { createQuotation } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NewQuote() {
  const [customers, products] = await Promise.all([
    searchRead("res.partner", [["customer_rank", ">", 0]], ["name"]),
    searchRead(
      "product.product",
      [["sale_ok", "=", true], ["bom_ids", "!=", false]],
      ["name", "list_price"]
    ),
  ]);

  return (
    <Shell title="New Quotation" crumb="Prices come straight from the live cost sheet">
      <div className="card" style={{ maxWidth: 560 }}>
        <form action={createQuotation}>
          <div className="field">
            <label>Customer</label>
            <select name="partner_id" required>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Product</label>
            <select name="product_id" required>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {inr(p.list_price)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Quantity</label>
            <input name="qty" type="number" min="1" defaultValue="10" required />
          </div>
          <div className="field">
            <label>Customer reference (optional)</label>
            <input name="client_ref" placeholder="e.g. PO-2026-104" />
          </div>
          <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="confirm"
              name="confirm"
              type="checkbox"
              style={{ width: "auto" }}
            />
            <label htmlFor="confirm" style={{ margin: 0 }}>
              Confirm immediately (kicks off production &amp; purchasing)
            </label>
          </div>
          <button className="btn">Create quotation</button>
        </form>
      </div>
    </Shell>
  );
}
