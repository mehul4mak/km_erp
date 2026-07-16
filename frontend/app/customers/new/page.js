import Link from "next/link";
import Shell from "@/components/Shell";
import { createContact } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function NewContact() {
  return (
    <Shell title="Add Contact" crumb="Create a customer or a vendor">
      <div className="page-actions">
        <Link href="/customers" className="btn secondary">← All contacts</Link>
      </div>
      <div className="card" style={{ maxWidth: 520 }}>
        <form action={createContact}>
          <div className="field">
            <label>Contact type</label>
            <select name="type" defaultValue="customer" required>
              <option value="customer">Customer (we sell to them)</option>
              <option value="vendor">Vendor (we buy from them)</option>
              <option value="both">Both — customer &amp; vendor</option>
            </select>
          </div>
          <div className="field">
            <label>Name</label>
            <input name="name" required placeholder="e.g. Sharma Distributors" />
          </div>
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" placeholder="optional" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input name="phone" placeholder="optional" />
          </div>
          <div className="field">
            <label>City</label>
            <input name="city" placeholder="optional" />
          </div>
          <button className="btn">Save contact</button>
        </form>
      </div>
    </Shell>
  );
}
