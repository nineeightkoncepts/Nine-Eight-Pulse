"use client";

import { useActionState } from "react";
import { changePlanAction, updateBusinessProfileAction } from "@/lib/actions/settings-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { PLAN_LIST } from "@/lib/plans";
import { formatDate } from "@/lib/format";

const emptyState: ActionState = {};

interface BusinessInfo {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  currency: string;
  taxRate: string;
  plan: string;
  billingCycle: string;
  status: string;
  trialEndsAt: Date | string | null;
  nextBillingDate: Date | string | null;
}

export function SettingsClient({ business }: { business: BusinessInfo }) {
  const [profileState, profileAction] = useActionState(updateBusinessProfileAction, emptyState);
  const [planState, planAction] = useActionState(changePlanAction, emptyState);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Business profile</h2>
        {profileState?.error && <p className="mt-3 text-sm text-red-400">{profileState.error}</p>}
        {profileState?.success && <p className="mt-3 text-sm text-emerald-400">{profileState.success}</p>}
        <form action={profileAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Business name</label>
            <input
              name="name"
              required
              defaultValue={business.name}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Contact email</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={business.email}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Phone</label>
            <input
              name="phone"
              defaultValue={business.phone ?? ""}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Currency code</label>
            <input
              name="currency"
              defaultValue={business.currency}
              maxLength={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm uppercase text-white outline-none focus:border-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Address</label>
            <input
              name="address"
              defaultValue={business.address ?? ""}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Sales tax rate (%)</label>
            <input
              name="taxRate"
              type="number"
              step="0.01"
              min="0"
              defaultValue={business.taxRate}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Subscription</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              business.status === "active"
                ? "bg-emerald-500/10 text-emerald-400"
                : business.status === "trial"
                  ? "bg-sky-500/10 text-sky-400"
                  : "bg-red-500/10 text-red-400"
            }`}
          >
            {business.status}
          </span>
        </div>
        <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          {business.status === "trial" && business.trialEndsAt && (
            <p>Trial ends: <span className="text-white">{formatDate(business.trialEndsAt)}</span></p>
          )}
          {business.nextBillingDate && (
            <p>Next billing date: <span className="text-white">{formatDate(business.nextBillingDate)}</span></p>
          )}
          <p>Billing cycle: <span className="capitalize text-white">{business.billingCycle}</span></p>
        </div>
        {planState?.error && <p className="mt-3 text-sm text-red-400">{planState.error}</p>}
        {planState?.success && <p className="mt-3 text-sm text-emerald-400">{planState.success}</p>}
        <form action={planAction} className="mt-5 grid gap-3 sm:grid-cols-3">
          <select
            name="plan"
            defaultValue={business.plan}
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
          >
            {PLAN_LIST.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} — ${p.monthlyPrice}/mo
              </option>
            ))}
          </select>
          <select
            name="billingCycle"
            defaultValue={business.billingCycle}
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
          >
            <option value="monthly">Monthly billing</option>
            <option value="annual">Annual billing (2 months free)</option>
          </select>
          <SubmitButton className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400">
            Update subscription
          </SubmitButton>
        </form>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {PLAN_LIST.map((p) => (
            <div key={p.key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">{p.name}</p>
              <p className="mt-1 text-xs text-slate-500">Up to {p.tillLimit ?? "unlimited"} tills</p>
              <p className="text-xs text-slate-500">Up to {p.staffLimit ?? "unlimited"} staff</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
