"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireRole } from "@/lib/session-helpers";
import { PLANS, type PlanKey } from "@/lib/plans";
import type { ActionState } from "./auth-actions";

export async function updateBusinessProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["owner"]);
  if (!session.businessId) return { error: "No business found." };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const currency = String(formData.get("currency") || "USD").trim().toUpperCase();
  const taxRate = String(formData.get("taxRate") || "0");

  if (!name || !email) return { error: "Business name and email are required." };

  await db
    .update(businesses)
    .set({
      name,
      email,
      phone: phone || null,
      address: address || null,
      currency: currency || "USD",
      taxRate,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, session.businessId));

  revalidatePath("/dashboard/settings");
  return { success: "Business profile updated." };
}

export async function changePlanAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["owner"]);
  if (!session.businessId) return { error: "No business found." };

  const plan = String(formData.get("plan") || "") as PlanKey;
  const billingCycle = String(formData.get("billingCycle") || "monthly") as "monthly" | "annual";

  if (!PLANS[plan]) return { error: "Invalid plan." };

  const nextBillingDate = new Date();
  if (billingCycle === "annual") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  }

  await db
    .update(businesses)
    .set({
      plan,
      billingCycle,
      status: "active",
      nextBillingDate,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, session.businessId));

  revalidatePath("/dashboard/settings");
  return { success: `Subscription updated to ${PLANS[plan].name} (${billingCycle}).` };
}
