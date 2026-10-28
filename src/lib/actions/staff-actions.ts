"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, businesses } from "@/db/schema";
import { requireRole } from "@/lib/session-helpers";
import { hashPassword } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import type { ActionState } from "./auth-actions";

export async function createStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return { error: "No business found." };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "cashier") as "manager" | "cashier";

  if (!name || !email || !password) return { error: "All fields are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (session.role === "manager" && role !== "cashier") {
    return { error: "Managers can only create cashier accounts." };
  }
  if (!["manager", "cashier"].includes(role)) return { error: "Invalid role." };

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return { error: "A user with this email already exists." };

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, session.businessId));
  const limit = biz ? PLANS[biz.plan].staffLimit : null;
  if (limit !== null) {
    const existingStaff = await db.select().from(users).where(eq(users.businessId, session.businessId));
    if (existingStaff.length >= limit) {
      return { error: `Your ${biz?.plan} plan allows up to ${limit} staff accounts. Upgrade to add more.` };
    }
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    businessId: session.businessId,
    name,
    email,
    passwordHash,
    role,
    status: "active",
  });

  revalidatePath("/dashboard/staff");
  return { success: "Staff account created." };
}

export async function toggleStaffStatusAction(userId: number) {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.businessId, session.businessId)));
  if (!user) return;
  if (user.role === "owner") return;
  if (session.role === "manager" && user.role !== "cashier") return;

  await db
    .update(users)
    .set({ status: user.status === "active" ? "disabled" : "active" })
    .where(eq(users.id, userId));
  revalidatePath("/dashboard/staff");
}

export async function resetStaffPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(["owner", "manager"]);
  if (!session.businessId) return { error: "No business found." };

  const userId = Number(formData.get("userId"));
  const newPassword = String(formData.get("newPassword") || "");
  if (!userId || newPassword.length < 8) return { error: "Password must be at least 8 characters." };

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.businessId, session.businessId)));
  if (!user) return { error: "Staff member not found." };
  if (session.role === "manager" && user.role !== "cashier") {
    return { error: "Managers can only reset cashier passwords." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  revalidatePath("/dashboard/staff");
  return { success: "Password updated." };
}
