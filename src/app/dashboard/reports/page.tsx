import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { businesses, orders, tills, users } from "@/db/schema";
import { requireBusinessSession } from "@/lib/session-helpers";
import { formatDateTime, formatMoney } from "@/lib/format";
import { VoidButton } from "./void-button";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; tillId?: string; userId?: string }>;
}) {
  const session = await requireBusinessSession();
  const params = await searchParams;
  const businessId = session.businessId;

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const currency = biz?.currency ?? "USD";

  const tillRows = await db.select().from(tills).where(eq(tills.businessId, businessId));
  const staffRows = await db.select().from(users).where(eq(users.businessId, businessId));

  const conditions = [eq(orders.businessId, businessId)];
  if (params.from) conditions.push(gte(orders.createdAt, new Date(params.from)));
  if (params.to) {
    const to = new Date(params.to);
    to.setHours(23, 59, 59, 999);
    conditions.push(lte(orders.createdAt, to));
  }
  if (params.tillId) conditions.push(eq(orders.tillId, Number(params.tillId)));
  if (params.userId) conditions.push(eq(orders.userId, Number(params.userId)));
  if (session.role === "cashier") conditions.push(eq(orders.userId, session.userId));

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      subtotal: orders.subtotal,
      taxTotal: orders.taxTotal,
      paymentMethod: orders.paymentMethod,
      status: orders.status,
      createdAt: orders.createdAt,
      cashierName: users.name,
      tillName: tills.name,
      userId: orders.userId,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(tills, eq(tills.id, orders.tillId))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const completed = rows.filter((r) => r.status === "completed");
  const totalSales = completed.reduce((sum, r) => sum + Number(r.total), 0);
  const totalTax = completed.reduce((sum, r) => sum + Number(r.taxTotal), 0);
  const byPayment = completed.reduce<Record<string, number>>((acc, r) => {
    acc[r.paymentMethod] = (acc[r.paymentMethod] ?? 0) + Number(r.total);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sales reports</h1>
        <p className="mt-1 text-sm text-slate-400">Filter transactions by date, till or staff member.</p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs text-slate-400">From</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">To</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Till</label>
          <select
            name="tillId"
            defaultValue={params.tillId ?? ""}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          >
            <option value="">All tills</option>
            {tillRows.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {session.role !== "cashier" && (
          <div>
            <label className="mb-1 block text-xs text-slate-400">Staff</label>
            <select
              name="userId"
              defaultValue={params.userId ?? ""}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              <option value="">All staff</option>
              {staffRows
                .filter((u) => u.role !== "platform_admin")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div className="flex items-end">
          <button className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
            Apply filters
          </button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs uppercase text-slate-500">Total sales</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatMoney(totalSales, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs uppercase text-slate-500">Tax collected</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatMoney(totalTax, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs uppercase text-slate-500">By payment method</p>
          <div className="mt-2 space-y-1 text-sm">
            {Object.entries(byPayment).map(([method, amount]) => (
              <div key={method} className="flex justify-between text-slate-300">
                <span className="capitalize">{method.replace("_", " ")}</span>
                <span>{formatMoney(amount, currency)}</span>
              </div>
            ))}
            {Object.keys(byPayment).length === 0 && <p className="text-slate-500">No data</p>}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Till</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-300">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-white">{r.orderNumber}</td>
                <td className="px-4 py-3">{r.tillName}</td>
                <td className="px-4 py-3">{r.cashierName}</td>
                <td className="px-4 py-3 capitalize">{r.paymentMethod.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                      r.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">{formatMoney(r.total, currency)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === "completed" && (
                    <VoidButton orderId={r.id} disabled={session.role === "cashier" && r.userId !== session.userId} />
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
