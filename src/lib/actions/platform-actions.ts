"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, subscriptionPayments, users } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/session-helpers";
import { PLANS, type PlanKey } from "@/lib/plans";
import { hashPassword } from "@/lib/auth";
import type { ActionState } from "./auth-actions";

export async function updateBusinessStatusAction(
  businessId: number,
  status: "trial" | "active" | "suspended" | "cancelled",
  reason?: string,
) {
  await requirePlatformAdmin();
  await db
    .update(businesses)
    .set({ status, suspendedReason: status === "suspended" ? reason || "Suspended by platform admin" : null, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));
  revalidatePath("/platform");
  revalidatePath(`/platform/businesses/${businessId}`);
  revalidatePath("/platform/businesses");
}

export async function updateBusinessPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePlatformAdmin();
  const businessId = Number(formData.get("businessId"));
  const plan = String(formData.get("plan") || "") as PlanKey;
  const billingCycle = String(formData.get("billingCycle") || "monthly") as "monthly" | "annual";
  if (!businessId || !PLANS[plan]) return { error: "Invalid plan selection." };

  await db
    .update(businesses)
    .set({ plan, billingCycle, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  revalidatePath(`/platform/businesses/${businessId}`);
  return { success: "Plan updated." };
}

export async function recordPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const businessId = Number(formData.get("businessId"));
  const amount = String(formData.get("amount") || "0");
  const note = String(formData.get("note") || "");

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  if (!biz) return { error: "Business not found." };

  await db.insert(subscriptionPayments).values({
    businessId,
    amount,
    plan: biz.plan,
    billingCycle: biz.billingCycle,
    note: note || null,
    recordedByUserId: admin.userId,
  });

  const nextBillingDate = new Date();
  if (biz.billingCycle === "annual") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  }

  await db
    .update(businesses)
    .set({ status: "active", nextBillingDate, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  revalidatePath(`/platform/businesses/${businessId}`);
  return { success: "Payment recorded and subscription renewed." };
}

export async function resetOwnerPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePlatformAdmin();
  const userId = Number(formData.get("userId"));
  const newPassword = String(formData.get("newPassword") || "");
  if (!userId || newPassword.length < 8) return { error: "Password must be at least 8 characters." };

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  return { success: "Password reset." };
}

export async function toggleUserStatusPlatformAction(userId: number) {
  await requirePlatformAdmin();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return;
  await db
    .update(users)
    .set({ status: user.status === "active" ? "disabled" : "active" })
    .where(eq(users.id, userId));
  if (user.businessId) revalidatePath(`/platform/businesses/${user.businessId}`);
}
