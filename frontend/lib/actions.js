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
  const productId = parseInt(formData.get("product_id"), 10);
  const qty = parseFloat(formData.get("qty")) || 1;
  const ref = formData.get("client_ref") || false;
  const confirm = formData.get("confirm") === "on";

  const soId = await callKw("sale.order", "create", [
    {
      partner_id: partnerId,
      client_order_ref: ref,
      order_line: [[0, 0, { product_id: productId, product_uom_qty: qty }]],
    },
  ]);
  if (confirm) {
    await callKw("sale.order", "action_confirm", [[soId]]);
  }
  revalidatePath("/orders");
  revalidatePath("/production");
  revalidatePath("/purchasing");
  redirect(`/orders/${soId}`);
}

export async function confirmOrder(soId) {
  await callKw("sale.order", "action_confirm", [[soId]]);
  revalidatePath(`/orders/${soId}`);
  revalidatePath("/orders");
  revalidatePath("/production");
  revalidatePath("/purchasing");
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

// ---- Contacts (customers & vendors) ----
export async function createCustomer(formData) {
  await callKw("res.partner", "create", [
    {
      name: formData.get("name"),
      email: formData.get("email") || false,
      phone: formData.get("phone") || false,
      city: formData.get("city") || false,
      customer_rank: 1,
    },
  ]);
  revalidatePath("/customers");
  redirect("/customers");
}

export async function createVendor(formData) {
  await callKw("res.partner", "create", [
    {
      name: formData.get("name"),
      email: formData.get("email") || false,
      phone: formData.get("phone") || false,
      city: formData.get("city") || false,
      supplier_rank: 1,
    },
  ]);
  revalidatePath("/customers");
  redirect("/customers");
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
