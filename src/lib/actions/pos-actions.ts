"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, inventoryItems, orderItems, orders, tillSessions } from "@/db/schema";
import { requireBusinessSession } from "@/lib/session-helpers";

export interface CartLine {
  inventoryItemId: number;
  quantity: number;
}

export interface PlaceOrderResult {
  error?: string;
  success?: boolean;
  orderNumber?: string;
}

export async function placeOrderAction(
  tillSessionId: number,
  lines: CartLine[],
  paymentMethod: "cash" | "card" | "mobile_money" | "other",
  customerName?: string,
): Promise<PlaceOrderResult> {
  const session = await requireBusinessSession();

  if (!lines.length) return { error: "Your cart is empty." };

  const [tillSession] = await db
    .select()
    .from(tillSessions)
    .where(and(eq(tillSessions.id, tillSessionId), eq(tillSessions.businessId, session.businessId)));

  if (!tillSession || tillSession.status !== "open") {
    return { error: "This till session is not open." };
  }
  if (tillSession.userId !== session.userId && session.role === "cashier") {
    return { error: "You can only sell on your own till session." };
  }

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, session.businessId));
  const taxRate = biz ? Number(biz.taxRate) : 0;

  const itemIds = lines.map((l) => l.inventoryItemId);
  const items = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.businessId, session.businessId));
  const itemMap = new Map(items.map((i) => [i.id, i]));

  let subtotal = 0;
  const resolvedLines: { item: (typeof items)[number]; quantity: number }[] = [];

  for (const line of lines) {
    const item = itemMap.get(line.inventoryItemId);
    if (!item || !itemIds.includes(line.inventoryItemId)) continue;
    if (!item.isActive) continue;
    if (line.quantity <= 0) continue;
    if (item.trackInventory && Number(item.quantity) < line.quantity) {
      return { error: `Not enough stock for "${item.name}". Available: ${item.quantity}.` };
    }
    subtotal += Number(item.price) * line.quantity;
    resolvedLines.push({ item, quantity: line.quantity });
  }

  if (!resolvedLines.length) return { error: "Your cart is empty." };

  const taxTotal = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxTotal) * 100) / 100;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const [order] = await db
    .insert(orders)
    .values({
      businessId: session.businessId,
      tillId: tillSession.tillId,
      tillSessionId,
      userId: session.userId,
      orderNumber,
      customerName: customerName || null,
      subtotal: String(subtotal.toFixed(2)),
      taxTotal: String(taxTotal.toFixed(2)),
      discountTotal: "0",
      total: String(total.toFixed(2)),
      paymentMethod,
      status: "completed",
    })
    .returning();

  for (const line of resolvedLines) {
    await db.insert(orderItems).values({
      orderId: order.id,
      inventoryItemId: line.item.id,
      name: line.item.name,
      price: line.item.price,
      quantity: String(line.quantity),
      lineTotal: String((Number(line.item.price) * line.quantity).toFixed(2)),
    });

    if (line.item.trackInventory) {
      const newQty = Math.max(0, Number(line.item.quantity) - line.quantity);
      await db
        .update(inventoryItems)
        .set({ quantity: String(newQty), updatedAt: new Date() })
        .where(eq(inventoryItems.id, line.item.id));
    }
  }

  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/reports");

  return { success: true, orderNumber: order.orderNumber };
}

export async function voidOrderAction(orderId: number) {
  const session = await requireBusinessSession();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.businessId, session.businessId)));
  if (!order || order.status !== "completed") return;
  if (session.role === "cashier" && order.userId !== session.userId) return;

  await db.update(orders).set({ status: "voided" }).where(eq(orders.id, orderId));

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const line of items) {
    if (!line.inventoryItemId) continue;
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, line.inventoryItemId));
    if (item && item.trackInventory) {
      const restored = Number(item.quantity) + Number(line.quantity);
      await db
        .update(inventoryItems)
        .set({ quantity: String(restored), updatedAt: new Date() })
        .where(eq(inventoryItems.id, item.id));
    }
  }

  revalidatePath("/pos");
  revalidatePath("/dashboard/reports");
}
