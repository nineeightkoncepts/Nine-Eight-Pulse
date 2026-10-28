import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { businesses, orders, subscriptionPayments, users } from "@/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { PLANS, planLabel } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function PlatformOverviewPage() {
  const allBusinesses = await db.select().from(businesses);
  const totalBusinesses = allBusinesses.length;
  const activeCount = allBusinesses.filter((b) => b.status === "active").length;
  const trialCount = allBusinesses.filter((b) => b.status === "trial").length;
  const suspendedCount = allBusinesses.filter((b) => b.status === "suspended" || b.status === "cancelled").length;

  const estimatedMrr = allBusinesses
    .filter((b) => b.status === "active")
    .reduce((sum, b) => {
      const plan = PLANS[b.plan];
      const monthly = b.billingCycle === "annual" ? plan.annualPrice / 12 : plan.monthlyPrice;
      return sum + monthly;
    }, 0);

  const totalOrdersResult = await db.execute<{ count: string }>(sql`select count(*)::int as count from orders where status = 'completed'`);
  const totalOrders = Number(totalOrdersResult.rows[0]?.count ?? 0);

  const totalUsers = await db.select().from(users);
  const staffCount = totalUsers.filter((u) => u.role !== "platform_admin").length;

  const recentBusinesses = [...allBusinesses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const recentPayments = await db
    .select({
      id: subscriptionPayments.id,
      amount: subscriptionPayments.amount,
      createdAt: subscriptionPayments.createdAt,
      businessName: businesses.name,
      plan: subscriptionPayments.plan,
    })
    .from(subscriptionPayments)
    .innerJoin(businesses, eq(businesses.id, subscriptionPayments.businessId))
    .orderBy(desc(subscriptionPayments.createdAt))
    .limit(6);

  const stats = [
    { label: "Total businesses", value: String(totalBusinesses) },
    { label: "Active subscriptions", value: String(activeCount) },
    { label: "On trial", value: String(trialCount) },
    { label: "Suspended / cancelled", value: String(suspendedCount) },
    { label: "Estimated MRR", value: formatMoney(estimatedMrr) },
    { label: "Total staff accounts", value: String(staffCount) },
    { label: "Orders processed", value: String(totalOrders) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Nine Eight Koncepts control center — oversee every business on Nine Eight Pulse.
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recently onboarded</h2>
            <Link href="/platform/businesses" className="text-xs font-medium text-amber-400 hover:text-amber-300">
              View all →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentBusinesses.map((b) => (
              <Link
                key={b.id}
                href={`/platform/businesses/${b.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3 hover:border-slate-600"
              >
                <div>
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-xs text-slate-500">
                    {planLabel(b.plan)} · joined {formatDate(b.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                    b.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : b.status === "trial"
                        ? "bg-sky-500/10 text-sky-400"
                        : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {b.status}
                </span>
              </Link>
            ))}
            {recentBusinesses.length === 0 && <p className="text-sm text-slate-500">No businesses yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Recent subscription payments</h2>
          <div className="mt-4 space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div>
                  <p className="text-sm font-medium text-white">{p.businessName}</p>
                  <p className="text-xs text-slate-500">
                    {planLabel(p.plan)} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{formatMoney(p.amount)}</span>
              </div>
            ))}
            {recentPayments.length === 0 && <p className="text-sm text-slate-500">No payments recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
