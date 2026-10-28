import { redirect } from "next/navigation";
import { getSession, SessionPayload, UserRole } from "./auth";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(roles: UserRole[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect(session.role === "cashier" ? "/pos" : session.role === "platform_admin" ? "/platform" : "/dashboard");
  }
  return session;
}

export async function requireBusinessSession(): Promise<SessionPayload & { businessId: number }> {
  const session = await requireRole(["owner", "manager", "cashier"]);
  if (!session.businessId) {
    redirect("/login");
  }
  return session as SessionPayload & { businessId: number };
}

export async function requirePlatformAdmin(): Promise<SessionPayload> {
  return requireRole(["platform_admin"]);
}
