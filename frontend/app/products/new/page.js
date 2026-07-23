import Shell from "@/components/Shell";
import Link from "next/link";
import { searchRead } from "@/lib/odoo";
import { createProduct } from "@/lib/actions";
import ProductBuilder from "@/components/ProductBuilder";

export const dynamic = "force-dynamic";

export default async function NewProduct({ searchParams }) {
  const [components, vendors] = await Promise.all([
    searchRead("product.product", [["purchase_ok", "=", true]], ["name", "standard_price"], { order: "name asc" }),
    searchRead("res.partner", [["supplier_rank", ">", 0]], ["name"], { order: "name asc" }),
  ]);

  return (
    <Shell title="New Product" crumb="Add a finished good, a semi-finished sub-assembly, or a bought part">
      <div className="page-actions">
        <Link href="/products" className="btn secondary">← All products</Link>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        {searchParams?.error === "name" && (
          <div className="login-error" style={{ marginBottom: 14 }}>Give the product a name.</div>
        )}
        {searchParams?.error === "empty" && (
          <div className="login-error" style={{ marginBottom: 14 }}>Add at least one component.</div>
        )}
        <form action={createProduct}>
          <ProductBuilder components={components} vendors={vendors} />
        </form>
      </div>
    </Shell>
  );
}
