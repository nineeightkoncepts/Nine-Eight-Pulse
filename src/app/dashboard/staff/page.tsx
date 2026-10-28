import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/session-helpers";
import { StaffClient } from "./staff-client";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await requireRole(["owner", "manager"]);
  const businessId = session.businessId as number;

  const staffRows = await db
    .select()
    .from(users)
    .where(eq(users.businessId, businessId))
    .orderBy(users.role, users.name);

  const staff = staffRows
    .filter((u) => u.role !== "platform_admin")
    .map((u) => ({ ...u, role: u.role as "owner" | "manager" | "cashier" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Staff accounts</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage who has access to your business and what they&apos;re allowed to do.
        </p>
      </div>
      <StaffClient staff={staff} currentRole={session.role as "owner" | "manager"} />
    </div>
  );
}
