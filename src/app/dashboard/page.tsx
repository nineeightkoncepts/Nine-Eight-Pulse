import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { businesses, inventoryItems, orders, tillSessions, tills, users } from "@/db/schema";
import { requireBusinessSession } from "@/lib/session-helpers";
import { formatMoney, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await requireBusinessSession();
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, session.businessId));
  const currency = biz?.currency ?? "USD";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.businessId, session.businessId),
        eq(orders.status, "completed"),
        gte(orders.createdAt, startOfDay),
      ),
    );

  const todaysTotal = todaysOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const allItems = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.businessId, session.businessId));
  const lowStockItems = allItems.filter(
    (i) => i.trackInventory && Number(i.quantity) <= Number(i.lowStockThreshold),
  );

  const activeSessions = await db
    .select({
      id: tillSessions.id,
      openedAt: tillSessions.openedAt,
      openingCash: tillSessions.openingCash,
      tillName: tills.name,
      userName: users.name,
    })
    .from(tillSessions)
    .innerJoin(tills, eq(tills.id, tillSessions.tillId))
    .innerJoin(users, eq(users.id, tillSessions.userId))
    .where(and(eq(tillSessions.businessId, session.businessId), eq(tillSessions.status, "open")));

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      createdAt: orders.createdAt,
      status: orders.status,
      cashierName: users.name,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.businessId, session.businessId))
    .orderBy(desc(orders.createdAt))
    .limit(8);

  const topItemsRaw = await db.execute<{ name: string; total_qty: string; total_sales: string }>(sql`
    select oi.name as name, sum(oi.quantity) as total_qty, sum(oi.line_total) as total_sales
    from order_items oi
    inner join orders o on o.id = oi.order_id
    where o.business_id = ${session.businessId} and o.status = 'completed'
    group by oi.name
    order by sum(oi.line_total) desc
    limit 5
  `);
  const topItems = topItemsRaw.rows;

  const stats = [
    { label: "Today's sales", value: formatMoney(todaysTotal, currency) },
    { label: "Orders today", value: String(todaysOrders.length) },
    { label: "Active tills", value: String(activeSessions.length) },
    { label: "Low stock items", value: String(lowStockItems.length) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Business overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          A quick snapshot of {biz?.name}&apos;s sales and operations right now.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent orders</h2>
            <Link href="/dashboard/reports" className="text-xs font-medium text-amber-400 hover:text-amber-300">
              View all reports →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4">Order</th>
                  <th className="pb-2 pr-4">Cashier</th>
                  <th className="pb-2 pr-4">Payment</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="text-slate-300">
                    <td className="py-2.5 pr-4 font-medium text-white">{o.orderNumber}</td>
                    <td className="py-2.5 pr-4">{o.cashierName}</td>
                    <td className="py-2.5 pr-4 capitalize">{o.paymentMethod.replace("_", " ")}</td>
                    <td className="py-2.5 pr-4 capitalize">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          o.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{formatMoney(o.total, currency)}</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No orders yet. Open a till and start selling from the POS.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Active tills right now</h2>
            <div className="mt-4 space-y-3">
              {activeSessions.map((s) => (
                <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm">
                  <p className="font-medium text-white">{s.tillName}</p>
                  <p className="text-xs text-slate-400">
                    {s.userName} · opened {formatDateTime(s.openedAt)}
                  </p>
                </div>
              ))}
              {activeSessions.length === 0 && (
                <p className="text-sm text-slate-500">No tills are currently open.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Top selling items</h2>
            <div className="mt-4 space-y-2">
              {topItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="text-slate-500">{formatMoney(item.total_sales, currency)}</span>
                </div>
              ))}
              {topItems.length === 0 && <p className="text-sm text-slate-500">No sales data yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold text-amber-400">⚠ Low stock alert</h2>
          <p className="mt-1 text-sm text-slate-400">The following items are running low and need restocking.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {lowStockItems.map((i) => (
              <span key={i.id} className="rounded-full border border-amber-500/30 bg-slate-950/50 px-3 py-1 text-xs text-amber-300">
                {i.name} — {i.quantity} left
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
