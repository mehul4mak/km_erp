import Link from "next/link";
import Shell from "@/components/Shell";
import { searchRead } from "@/lib/odoo";

export const dynamic = "force-dynamic";

function ContactTable({ rows }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>City</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td className="empty" colSpan={4}>
              No contacts yet.
            </td>
          </tr>
        )}
        {rows.map((c) => (
          <tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td>{c.email || "—"}</td>
            <td>{c.phone || "—"}</td>
            <td>{c.city || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Contacts() {
  const [customers, vendors] = await Promise.all([
    searchRead(
      "res.partner",
      [["customer_rank", ">", 0]],
      ["name", "email", "phone", "city"],
      { order: "name asc" }
    ),
    searchRead(
      "res.partner",
      [["supplier_rank", ">", 0]],
      ["name", "email", "phone", "city"],
      { order: "name asc" }
    ),
  ]);

  return (
    <Shell title="Contacts" crumb="Your customers and vendors in one place">
      <div className="page-actions">
        <Link href="/customers/new" className="btn">
          + Add contact
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>
          Customers ({customers.length}){" "}
          <span className="badge blue">sells to</span>
        </h2>
        <ContactTable rows={customers} />
      </div>

      <div className="card">
        <h2>
          Vendors ({vendors.length}) <span className="badge gray">buys from</span>
        </h2>
        <ContactTable rows={vendors} />
      </div>
    </Shell>
  );
}
