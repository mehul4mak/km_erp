"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { callKw } from "./odoo";

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
