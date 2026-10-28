import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, categories, inventoryItems, tillSessions, tills } from "@/db/schema";
import { requireBusinessSession } from "@/lib/session-helpers";
import { TillSelector } from "./till-selector";
import { SellScreen } from "./sell-screen";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const session = await requireBusinessSession();
  const businessId = session.businessId;

  const [openSession] = await db
    .select()
    .from(tillSessions)
    .where(
      and(
        eq(tillSessions.businessId, businessId),
        eq(tillSessions.userId, session.userId),
        eq(tillSessions.status, "open"),
      ),
    );

  if (!openSession) {
    const availableTills = await db
      .select()
      .from(tills)
      .where(and(eq(tills.businessId, businessId), eq(tills.isActive, true), eq(tills.status, "closed")));
    return <TillSelector tills={availableTills} />;
  }

  const [till] = await db.select().from(tills).where(eq(tills.id, openSession.tillId));
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const items = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.businessId, businessId), eq(inventoryItems.isActive, true)))
    .orderBy(inventoryItems.name);
  const cats = await db.select().from(categories).where(eq(categories.businessId, businessId)).orderBy(categories.name);

  return (
    <SellScreen
      sessionId={openSession.id}
      tillName={till?.name ?? "Till"}
      items={items}
      categories={cats}
      currency={biz?.currency ?? "USD"}
      taxRate={Number(biz?.taxRate ?? 0)}
    />
  );
}
