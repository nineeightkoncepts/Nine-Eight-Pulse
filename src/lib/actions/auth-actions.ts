"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import {
  createSessionCookie,
  destroySessionCookie,
  hashPassword,
  homePathForRole,
  verifyPassword,
} from "@/lib/auth";

export interface ActionState {
  error?: string;
  success?: string;
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "business"
  );
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return { error: "Invalid email or password." };
  }
  if (user.status === "disabled") {
    return { error: "This account has been disabled. Contact your business owner." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  if (user.businessId) {
    const [biz] = await db.select().from(businesses).where(eq(businesses.id, user.businessId));
    if (biz && (biz.status === "suspended" || biz.status === "cancelled")) {
      return { error: `This business account is ${biz.status}. Please contact Nine Eight Pulse support.` };
    }
  }

  await createSessionCookie({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  redirect(next && next.startsWith("/") ? next : homePathForRole(user.role));
}

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/login");
}

export async function registerBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessName = String(formData.get("businessName") || "").trim();
  const businessType = String(formData.get("businessType") || "restaurant");
  const ownerName = String(formData.get("ownerName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const plan = String(formData.get("plan") || "starter");

  if (!businessName || !ownerName || !email || !password) {
    return { error: "Please fill in all required fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, email));
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const baseSlug = slugify(businessName);
  let slug = baseSlug;
  let attempt = 0;
  // ensure unique slug
  while (true) {
    const [existingBiz] = await db.select().from(businesses).where(eq(businesses.slug, slug));
    if (!existingBiz) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const trialEndsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

  const [biz] = await db
    .insert(businesses)
    .values({
      name: businessName,
      slug,
      businessType,
      email,
      phone,
      status: "trial",
      plan: (["starter", "growth", "pro", "enterprise"].includes(plan) ? plan : "starter") as
        | "starter"
        | "growth"
        | "pro"
        | "enterprise",
      billingCycle: "monthly",
      trialEndsAt,
    })
    .returning();

  const passwordHash = await hashPassword(password);

  const [owner] = await db
    .insert(users)
    .values({
      businessId: biz.id,
      name: ownerName,
      email,
      passwordHash,
      role: "owner",
      status: "active",
    })
    .returning();

  await createSessionCookie({
    userId: owner.id,
    businessId: biz.id,
    role: owner.role,
    name: owner.name,
    email: owner.email,
  });

  redirect("/dashboard");
}
