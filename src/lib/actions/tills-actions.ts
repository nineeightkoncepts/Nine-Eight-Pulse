"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tills, tillSessions, businesses, orders } from "@/db/schema";
import { requireRole, requireBusinessSession } from "@/lib/session-helpers";
import { PLANS } from "@/lib/plans";
import type { ActionState } from "./auth-actions";

export async function createTillAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return { error: "No business found." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Till name is required." };

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, session.businessId));
  const limit = biz ? PLANS[biz.plan].tillLimit : null;
  if (limit !== null) {
    const existing = await db.select().from(tills).where(eq(tills.businessId, session.businessId));
    if (existing.length >= limit) {
      return { error: `Your ${biz?.plan} plan allows up to ${limit} till(s). Upgrade your plan to add more.` };
    }
  }

  await db.insert(tills).values({ businessId: session.businessId, name });
  revalidatePath("/dashboard/tills");
  return { success: "Till created." };
}

export async function toggleTillActiveAction(tillId: number) {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return;
  const [till] = await db
    .select()
    .from(tills)
    .where(and(eq(tills.id, tillId), eq(tills.businessId, session.businessId)));
  if (!till) return;
  await db.update(tills).set({ isActive: !till.isActive }).where(eq(tills.id, tillId));
  revalidatePath("/dashboard/tills");
}

export async function forceCloseSessionAction(sessionId: number) {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return;
  const [tillSession] = await db
    .select()
    .from(tillSessions)
    .where(and(eq(tillSessions.id, sessionId), eq(tillSessions.businessId, session.businessId)));
  if (!tillSession || tillSession.status !== "open") return;

  await db
    .update(tillSessions)
    .set({
      status: "closed",
      closedAt: new Date(),
      closingCash: tillSession.openingCash,
      expectedCash: tillSession.openingCash,
      cashDifference: "0",
      note: "Force-closed by manager/owner.",
    })
    .where(eq(tillSessions.id, sessionId));

  await db.update(tills).set({ status: "closed" }).where(eq(tills.id, tillSession.tillId));
  revalidatePath("/dashboard/tills");
}

export async function openTillSessionAction(
  tillId: number,
  openingCash: number,
): Promise<{ error?: string; sessionId?: number }> {
  const session = await requireBusinessSession();

  const [till] = await db
    .select()
    .from(tills)
    .where(and(eq(tills.id, tillId), eq(tills.businessId, session.businessId)));
  if (!till || !till.isActive) return { error: "This till is not available." };
  if (till.status === "open") return { error: "This till is already in use by another worker." };

  const [existingUserSession] = await db
    .select()
    .from(tillSessions)
    .where(
      and(
        eq(tillSessions.userId, session.userId),
        eq(tillSessions.status, "open"),
        eq(tillSessions.businessId, session.businessId),
      ),
    );
  if (existingUserSession) {
    return { error: "You already have an open till session." };
  }

  const [created] = await db
    .insert(tillSessions)
    .values({
      tillId,
      businessId: session.businessId,
      userId: session.userId,
      openingCash: String(openingCash),
      status: "open",
    })
    .returning();

  await db.update(tills).set({ status: "open" }).where(eq(tills.id, tillId));
  revalidatePath("/pos");
  revalidatePath("/dashboard/tills");
  return { sessionId: created.id };
}

export async function closeTillSessionAction(
  sessionId: number,
  closingCash: number,
  note?: string,
): Promise<{ error?: string }> {
  const session = await requireBusinessSession();

  const [tillSession] = await db
    .select()
    .from(tillSessions)
    .where(and(eq(tillSessions.id, sessionId), eq(tillSessions.businessId, session.businessId)));

  if (!tillSession || tillSession.status !== "open") return { error: "Session not found or already closed." };
  if (tillSession.userId !== session.userId && session.role === "cashier") {
    return { error: "You can only close your own till session." };
  }

  const sessionOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.tillSessionId, sessionId), eq(orders.status, "completed")));

  const cashSales = sessionOrders
    .filter((o) => o.paymentMethod === "cash")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const expectedCash = Number(tillSession.openingCash) + cashSales;
  const difference = closingCash - expectedCash;

  await db
    .update(tillSessions)
    .set({
      status: "closed",
      closedAt: new Date(),
      closingCash: String(closingCash),
      expectedCash: String(expectedCash),
      cashDifference: String(difference),
      note: note || null,
    })
    .where(eq(tillSessions.id, sessionId));

  await db.update(tills).set({ status: "closed" }).where(eq(tills.id, tillSession.tillId));

  revalidatePath("/pos");
  revalidatePath("/dashboard/tills");
  return {};
}
