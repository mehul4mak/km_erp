import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";
import { createPurchaseOrder } from "@/lib/actions";
import CostSheetBuilder from "@/components/CostSheetBuilder";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrder({ searchParams }) {
  const [vendors, components] = await Promise.all([
    searchRead("res.partner", [["supplier_rank", ">", 0]], ["name"], { order: "name asc" }),
    searchRead(
      "product.product",
      [["purchase_ok", "=", true]],
      ["name", "standard_price"],
      { order: "name asc" }
    ),
  ]);

  return (
    <Shell
      title="New Purchase Order"
      crumb="Order components from a vendor — this raises an RFQ you then confirm, receive and inspect"
    >
      <div className="card" style={{ maxWidth: 720 }}>
        {searchParams?.error === "vendor" && (
          <div className="login-error" style={{ marginBottom: 14 }}>Choose a vendor.</div>
        )}
        {searchParams?.error === "empty" && (
          <div className="login-error" style={{ marginBottom: 14 }}>
            Add at least one component line.
          </div>
        )}
        <form action={createPurchaseOrder}>
          <div className="field">
            <label>Vendor</label>
            <select name="partner_id" required defaultValue="">
              <option value="" disabled>Choose a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <CostSheetBuilder components={components} />
          </div>

          <button className="btn">Create RFQ</button>
          <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 10 }}>
            Saved as a draft RFQ. Confirm it on the Purchasing screen → the goods arrive as a
            Goods Receipt → inward QC → received to store.
          </div>
        </form>
      </div>
    </Shell>
  );
}
