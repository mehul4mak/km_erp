import Link from "next/link";
import Shell from "@/components/Shell";
import { createCustomer, createVendor } from "@/lib/actions";

export const dynamic = "force-dynamic";

function Fields() {
  return (
    <>
      <div className="field">
        <label>Name</label>
        <input name="name" required />
      </div>
      <div className="field">
        <label>Email</label>
        <input name="email" type="email" />
      </div>
      <div className="field">
        <label>Phone</label>
        <input name="phone" />
      </div>
      <div className="field">
        <label>City</label>
        <input name="city" />
      </div>
    </>
  );
}

export default function NewContact() {
  return (
    <Shell title="Add Contact" crumb="Create a customer or a vendor">
      <div className="page-actions">
        <Link href="/customers" className="btn secondary">
          ← All contacts
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          maxWidth: 820,
        }}
      >
        <div className="card">
          <h2>Add a customer</h2>
          <form action={createCustomer}>
            <Fields />
            <button className="btn">Add customer</button>
          </form>
        </div>

        <div className="card">
          <h2>Add a vendor</h2>
          <form action={createVendor}>
            <Fields />
            <button className="btn">Add vendor</button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
