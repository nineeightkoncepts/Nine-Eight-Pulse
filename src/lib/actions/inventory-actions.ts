"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { categories, inventoryItems } from "@/db/schema";
import { requireRole } from "@/lib/session-helpers";
import type { ActionState } from "./auth-actions";

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["owner", "manager"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Category name is required." };
  if (!session.businessId) return { error: "No business found." };

  await db.insert(categories).values({ businessId: session.businessId, name });
  revalidatePath("/dashboard/inventory");
  return { success: "Category added." };
}

export async function deleteCategoryAction(categoryId: number) {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return;
  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.businessId, session.businessId)));
  revalidatePath("/dashboard/inventory");
}

export async function upsertInventoryItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return { error: "No business found." };

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const name = String(formData.get("name") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const categoryIdRaw = String(formData.get("categoryId") || "");
  const description = String(formData.get("description") || "").trim();
  const price = String(formData.get("price") || "0");
  const cost = String(formData.get("cost") || "0");
  const quantity = String(formData.get("quantity") || "0");
  const lowStockThreshold = String(formData.get("lowStockThreshold") || "5");
  const trackInventory = formData.get("trackInventory") === "on";
  const isActive = formData.get("isActive") === "on";

  if (!name) return { error: "Item name is required." };
  if (Number.isNaN(Number(price)) || Number(price) < 0) return { error: "Enter a valid price." };

  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : null;

  const values = {
    businessId: session.businessId,
    categoryId,
    name,
    sku: sku || null,
    description: description || null,
    price,
    cost,
    quantity,
    lowStockThreshold,
    trackInventory,
    isActive,
    updatedAt: new Date(),
  };

  if (id) {
    await db
      .update(inventoryItems)
      .set(values)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.businessId, session.businessId)));
    revalidatePath("/dashboard/inventory");
    return { success: "Item updated." };
  }

  await db.insert(inventoryItems).values(values);
  revalidatePath("/dashboard/inventory");
  return { success: "Item added." };
}

export async function deleteInventoryItemAction(itemId: number) {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return;
  await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.businessId, session.businessId)));
  revalidatePath("/dashboard/inventory");
}

export async function adjustStockAction(itemId: number, delta: number) {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return;
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.businessId, session.businessId)));
  if (!item) return;
  const newQty = Math.max(0, Number(item.quantity) + delta);
  await db
    .update(inventoryItems)
    .set({ quantity: String(newQty), updatedAt: new Date() })
    .where(eq(inventoryItems.id, itemId));
  revalidatePath("/dashboard/inventory");
}
