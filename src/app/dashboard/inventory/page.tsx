import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, categories, inventoryItems } from "@/db/schema";
import { requireRole } from "@/lib/session-helpers";
import { InventoryClient } from "./inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await requireRole(["owner", "manager"]);
  const businessId = session.businessId as number;

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const items = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.businessId, businessId))
    .orderBy(inventoryItems.name);
  const cats = await db.select().from(categories).where(eq(categories.businessId, businessId)).orderBy(categories.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inventory</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage every dish, drink and product your team sells on the POS floor.
        </p>
      </div>
      <InventoryClient items={items} categories={cats} currency={biz?.currency ?? "USD"} />
    </div>
  );
}
