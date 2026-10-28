import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireRole } from "@/lib/session-helpers";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireRole(["owner"]);
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, session.businessId as number));

  if (!biz) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your business profile and Nine Eight Pulse subscription.</p>
      </div>
      <SettingsClient business={biz} />
    </div>
  );
}
