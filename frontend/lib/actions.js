"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { callKw } from "./odoo";
import { SESSION_COOKIE } from "./auth";

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}

export async function updateCostSheet(bomId, formData) {
  const rejection = parseFloat(formData.get("rejection_pct"));
  const profit = parseFloat(formData.get("profit_pct"));
  await callKw("mrp.bom", "write", [
    [bomId],
    {
      rejection_pct: isNaN(rejection) ? 0 : rejection,
      profit_pct: isNaN(profit) ? 0 : profit,
    },
  ]);
  revalidatePath(`/costsheets/${bomId}`);
  revalidatePath("/costsheets");
}

export async function applyPrice(bomId) {
  await callKw("mrp.bom", "action_cs_apply_price", [[bomId]]);
  revalidatePath(`/costsheets/${bomId}`);
  revalidatePath("/costsheets");
}

export async function createQuotation(formData) {
  const partnerId = parseInt(formData.get("partner_id"), 10);
  const ref = formData.get("client_ref") || false;
  // Multiple line items: parallel product / qty arrays from the line editor.
  const products = formData.getAll("line_product");
  const qtys = formData.getAll("line_qty");
  const lines = [];
  for (let i = 0; i < products.length; i++) {
    const pid = parseInt(products[i], 10);
    const q = parseFloat(qtys[i]) || 0;
    if (pid && q > 0) lines.push([0, 0, { product_id: pid, product_uom_qty: q }]);
  }
  if (lines.length === 0) redirect("/orders/new?error=empty");

  const soId = await callKw("sale.order", "create", [
    { partner_id: partnerId, client_order_ref: ref, order_line: lines },
  ]);
  revalidatePath("/orders");
  redirect(`/orders/${soId}`);
}

export async function sendQuotation(soId) {
  await callKw("sale.order", "write", [[soId], { state: "sent" }]);
  revalidatePath(`/orders/${soId}`);
  revalidatePath("/orders");
}

export async function confirmOrder(soId) {
  await callKw("sale.order", "action_confirm", [[soId]]);
  revalidatePath(`/orders/${soId}`);
  revalidatePath("/orders");
  revalidatePath("/production");
  revalidatePath("/purchasing");
  revalidatePath("/requisitions");
}

export async function setQualityResult(checkId, result, formData) {
  const note = formData?.get?.("note") || false;
  await callKw("mfg.quality.check", "action_set_result", [[checkId], result, note]);
  revalidatePath("/quality");
  revalidatePath("/production");
}

export async function markProductionDone(moId) {
  try {
    await callKw("mrp.production", "button_mark_done", [[moId]]);
  } catch (e) {
    // QA gate rejection surfaces as a friendly redirect message
    redirect(`/production?blocked=${encodeURIComponent(e.message)}`);
  }
  revalidatePath("/production");
  revalidatePath("/inventory");
}

export async function confirmPurchase(poId) {
  await callKw("purchase.order", "button_confirm", [[poId]]);
  revalidatePath("/purchasing");
  revalidatePath("/goods-receipt");
}

// ---- Purchasing: raise a purchase order manually (order stock directly) ----
export async function createPurchaseOrder(formData) {
  const partnerId = parseInt(formData.get("partner_id"), 10);
  if (!partnerId) redirect("/purchasing/new?error=vendor");

  const products = formData.getAll("line_product");
  const qtys = formData.getAll("line_qty");
  const wanted = [];
  for (let i = 0; i < products.length; i++) {
    const pid = parseInt(products[i], 10);
    const q = parseFloat(qtys[i]) || 0;
    if (pid && q > 0) wanted.push([pid, q]);
  }
  if (wanted.length === 0) redirect("/purchasing/new?error=empty");

  const prods = await callKw("product.product", "read", [
    wanted.map(([pid]) => pid),
    ["name", "standard_price", "uom_po_id"],
  ]);
  const info = Object.fromEntries(prods.map((p) => [p.id, p]));
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const lines = wanted.map(([pid, q]) => {
    const p = info[pid];
    return [0, 0, {
      product_id: pid,
      name: p.name,
      product_qty: q,
      product_uom: p.uom_po_id[0],
      price_unit: p.standard_price || 0,
      date_planned: now,
    }];
  });

  await callKw("purchase.order", "create", [{ partner_id: partnerId, order_line: lines }]);
  revalidatePath("/purchasing");
  redirect("/purchasing");
}

// ---- Contacts (one form, a type selector decides customer vs vendor) ----
export async function createContact(formData) {
  const type = formData.get("type"); // "customer" | "vendor" | "both"
  await callKw("res.partner", "create", [
    {
      name: formData.get("name"),
      email: formData.get("email") || false,
      phone: formData.get("phone") || false,
      city: formData.get("city") || false,
      customer_rank: type === "vendor" ? 0 : 1,
      supplier_rank: type === "customer" ? 0 : 1,
    },
  ]);
  revalidatePath("/customers");
  redirect("/customers");
}

// ---- Cost sheet: freeze the current sheet as a version ----
export async function saveCostSheetVersion(bomId, formData) {
  const note = formData?.get?.("note") || false;
  await callKw("mrp.bom", "action_cs_save_version", [[bomId], note]);
  revalidatePath(`/costsheets/${bomId}`);
}

// ---- Cost sheet: manually override component rates ----
// Rates auto-fill from the last purchase price (FIFO valuation); saving here
// writes standard_price on the component, overriding it manually until the
// next receipt re-values it.
export async function saveComponentRates(bomId, formData) {
  const writes = [];
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("rate_")) continue;
    const pid = parseInt(k.slice(5), 10);
    const rate = parseFloat(v);
    if (pid && !isNaN(rate) && rate >= 0) writes.push([pid, rate]);
  }
  for (const [pid, rate] of writes) {
    await callKw("product.product", "write", [[pid], { standard_price: rate }]);
  }
  revalidatePath(`/costsheets/${bomId}`);
  revalidatePath("/costsheets");
}

// ---- Cost sheet: create a brand-new one (finished product + its BOM) ----
export async function createCostSheet(formData) {
  const name = (formData.get("name") || "").trim();
  if (!name) redirect("/costsheets/new?error=name");
  const listPrice = parseFloat(formData.get("list_price")) || 0;
  const rejection = parseFloat(formData.get("rejection_pct"));
  const profit = parseFloat(formData.get("profit_pct"));
  const labour = parseFloat(formData.get("labour")) || 0;

  const products = formData.getAll("line_product");
  const qtys = formData.getAll("line_qty");
  const lines = [];
  for (let i = 0; i < products.length; i++) {
    const pid = parseInt(products[i], 10);
    const q = parseFloat(qtys[i]) || 0;
    if (pid && q > 0) lines.push([0, 0, { product_id: pid, product_qty: q }]);
  }
  if (lines.length === 0) redirect("/costsheets/new?error=empty");

  const tmplId = await callKw("product.template", "create", [
    { name, type: "product", sale_ok: true, purchase_ok: false, list_price: listPrice },
  ]);

  const bomVals = {
    product_tmpl_id: tmplId,
    product_qty: 1,
    bom_line_ids: lines,
    rejection_pct: isNaN(rejection) ? 2 : rejection,
    profit_pct: isNaN(profit) ? 7 : profit,
  };
  // Labour as a workcenter operation, so it lands in the "Labour" column.
  if (labour > 0) {
    const [wc] = await callKw("mrp.workcenter", "search_read", [
      [], ["id", "costs_hour"],
    ], { limit: 1 });
    if (wc && wc.costs_hour > 0) {
      bomVals.operation_ids = [
        [0, 0, {
          name: "Assembly & Testing",
          workcenter_id: wc.id,
          time_cycle_manual: (labour / wc.costs_hour) * 60,
        }],
      ];
    }
  }
  const bomId = await callKw("mrp.bom", "create", [bomVals]);
  revalidatePath("/costsheets");
  redirect(`/costsheets/${bomId}`);
}

// ---- Goods receipt: inward quality inspection + post to store ----
export async function recordInwardResult(pickingId, result, formData) {
  const note = formData?.get?.("note") || false;
  await callKw("stock.picking", "action_set_inward_result", [[pickingId], result, note]);
  revalidatePath("/goods-receipt");
}

export async function receiveToStore(pickingId) {
  try {
    await callKw("stock.picking", "action_receive_to_store", [[pickingId]]);
  } catch (e) {
    redirect(`/goods-receipt?blocked=${encodeURIComponent(e.message)}`);
  }
  revalidatePath("/goods-receipt");
  revalidatePath("/inventory");
  revalidatePath("/requisitions");
}

// ---- Material requisition: reserve components for a manufacturing job (FIFO) ----
export async function reserveForJob(moId) {
  await callKw("mrp.production", "action_assign", [[moId]]);
  revalidatePath("/requisitions");
  revalidatePath("/production");
  revalidatePath("/inventory");
}
