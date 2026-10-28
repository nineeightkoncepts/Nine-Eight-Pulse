import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, orders, tillSessions, tills, users } from "@/db/schema";
import { requireBusinessSession } from "@/lib/session-helpers";
import { TillsClient } from "./tills-client";

export const dynamic = "force-dynamic";

export default async function TillsPage() {
  const session = await requireBusinessSession();
  const businessId = session.businessId;
  const canManage = session.role === "owner" || session.role === "manager";

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const tillRows = await db.select().from(tills).where(eq(tills.businessId, businessId)).orderBy(tills.name);

  const openSessionRows = await db
    .select({
      id: tillSessions.id,
      tillName: tills.name,
      userName: users.name,
      openingCash: tillSessions.openingCash,
      openedAt: tillSessions.openedAt,
    })
    .from(tillSessions)
    .innerJoin(tills, eq(tills.id, tillSessions.tillId))
    .innerJoin(users, eq(users.id, tillSessions.userId))
    .where(and(eq(tillSessions.businessId, businessId), eq(tillSessions.status, "open")));

  const openSessions = await Promise.all(
    openSessionRows.map(async (s) => {
      const sessionOrders = await db
        .select()
        .from(orders)
        .where(and(eq(orders.tillSessionId, s.id), eq(orders.status, "completed")));
      const salesSoFar = sessionOrders.reduce((sum, o) => sum + Number(o.total), 0);
      return { ...s, salesSoFar };
    }),
  );

  const historyRows = await db
    .select({
      id: tillSessions.id,
      tillName: tills.name,
      userName: users.name,
      openingCash: tillSessions.openingCash,
      closingCash: tillSessions.closingCash,
      expectedCash: tillSessions.expectedCash,
      cashDifference: tillSessions.cashDifference,
      openedAt: tillSessions.openedAt,
      closedAt: tillSessions.closedAt,
    })
    .from(tillSessions)
    .innerJoin(tills, eq(tills.id, tillSessions.tillId))
    .innerJoin(users, eq(users.id, tillSessions.userId))
    .where(and(eq(tillSessions.businessId, businessId), eq(tillSessions.status, "closed")))
    .orderBy(desc(tillSessions.closedAt))
    .limit(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tills</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create registers for your workers and reconcile cash at the end of every shift.
        </p>
      </div>
      <TillsClient
        tills={tillRows}
        openSessions={openSessions}
        history={historyRows}
        currency={biz?.currency ?? "USD"}
        canManage={canManage}
      />
    </div>
  );
}
