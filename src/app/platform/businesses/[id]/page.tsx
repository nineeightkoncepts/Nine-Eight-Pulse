import { notFound } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, inventoryItems, orders, subscriptionPayments, tills, users } from "@/db/schema";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { planLabel } from "@/lib/plans";
import {
  PlanControls,
  RecordPaymentForm,
  StaffAdminTable,
  StatusControls,
} from "./business-admin-client";

export const dynamic = "force-dynamic";

export default async function PlatformBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) notFound();

  const [biz] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  if (!biz) notFound();

  const staffRows = await db.select().from(users).where(eq(users.businessId, businessId)).orderBy(users.role);
  const tillRows = await db.select().from(tills).where(eq(tills.businessId, businessId));
  const itemRows = await db.select().from(inventoryItems).where(eq(inventoryItems.businessId, businessId));
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.businessId, businessId));
  const completedOrders = orderRows.filter((o) => o.status === "completed");
  const totalSales = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const payments = await db
    .select()
    .from(subscriptionPayments)
    .where(eq(subscriptionPayments.businessId, businessId))
    .orderBy(desc(subscriptionPayments.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/platform/businesses" className="text-xs text-slate-500 hover:text-slate-300">
            ← Back to all businesses
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-white">{biz.name}</h1>
          <p className="text-sm text-slate-400">
            {biz.email} · {biz.phone || "No phone on file"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            biz.status === "active"
              ? "bg-emerald-500/10 text-emerald-400"
              : biz.status === "trial"
                ? "bg-sky-500/10 text-sky-400"
                : "bg-red-500/10 text-red-400"
          }`}
        >
          {biz.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Current plan", value: planLabel(biz.plan) },
          { label: "Total lifetime sales", value: formatMoney(totalSales, biz.currency) },
          { label: "Staff accounts", value: String(staffRows.length) },
          { label: "Tills / Items", value: `${tillRows.length} / ${itemRows.length}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-2 text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Subscription status</h2>
          <p className="mt-1 text-sm text-slate-400">
            Trial ends {formatDate(biz.trialEndsAt)} · Next billing {formatDate(biz.nextBillingDate)}
          </p>
          <div className="mt-4">
            <StatusControls
              business={{ id: biz.id, name: biz.name, status: biz.status, plan: biz.plan, billingCycle: biz.billingCycle }}
            />
          </div>
          {biz.suspendedReason && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              Reason: {biz.suspendedReason}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Change plan</h2>
          <p className="mt-1 text-sm text-slate-400">Override this business&apos;s subscription plan.</p>
          <div className="mt-4">
            <PlanControls
              business={{ id: biz.id, name: biz.name, status: biz.status, plan: biz.plan, billingCycle: biz.billingCycle }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Record a subscription payment</h2>
        <p className="mt-1 text-sm text-slate-400">
          Logs a manual payment and renews the subscription from today.
        </p>
        <div className="mt-4">
          <RecordPaymentForm businessId={biz.id} />
        </div>
        <div className="mt-5 space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-sm">
              <span className="text-slate-300">
                {formatDateTime(p.createdAt)} — {p.note || "Manual payment"}
              </span>
              <span className="font-semibold text-emerald-400">{formatMoney(p.amount, biz.currency)}</span>
            </div>
          ))}
          {payments.length === 0 && <p className="text-sm text-slate-500">No payments recorded yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Staff accounts</h2>
        <StaffAdminTable
          staff={staffRows.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            status: s.status,
            lastLoginAt: s.lastLoginAt,
          }))}
        />
      </div>
    </div>
  );
}
