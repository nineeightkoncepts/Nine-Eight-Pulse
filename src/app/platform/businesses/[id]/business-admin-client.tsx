"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  recordPaymentAction,
  resetOwnerPasswordAction,
  toggleUserStatusPlatformAction,
  updateBusinessPlanAction,
  updateBusinessStatusAction,
} from "@/lib/actions/platform-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { PLAN_LIST } from "@/lib/plans";
import { formatDateTime } from "@/lib/format";

const emptyState: ActionState = {};

interface BusinessInfo {
  id: number;
  name: string;
  status: "trial" | "active" | "suspended" | "cancelled";
  plan: string;
  billingCycle: string;
}

interface StaffRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "disabled";
  lastLoginAt: Date | string | null;
}

export function StatusControls({ business }: { business: BusinessInfo }) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const router = useRouter();

  function setStatus(status: "trial" | "active" | "suspended" | "cancelled") {
    startTransition(async () => {
      await updateBusinessStatusAction(business.id, status, reason || undefined);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["trial", "active", "suspended", "cancelled"] as const).map((s) => (
          <button
            key={s}
            disabled={pending}
            onClick={() => setStatus(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${
              business.status === s
                ? "border-amber-500 bg-amber-500/10 text-amber-400"
                : "border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (used when suspending)"
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
      />
    </div>
  );
}

export function PlanControls({ business }: { business: BusinessInfo }) {
  const [state, formAction] = useActionState(updateBusinessPlanAction, emptyState);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="businessId" value={business.id} />
      {state?.error && <p className="sm:col-span-3 text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="sm:col-span-3 text-sm text-emerald-400">{state.success}</p>}
      <select
        name="plan"
        defaultValue={business.plan}
        className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
      >
        {PLAN_LIST.map((p) => (
          <option key={p.key} value={p.key}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        name="billingCycle"
        defaultValue={business.billingCycle}
        className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
      >
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>
      <SubmitButton className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400">
        Update plan
      </SubmitButton>
    </form>
  );
}

export function RecordPaymentForm({ businessId }: { businessId: number }) {
  const [state, formAction] = useActionState(recordPaymentAction, emptyState);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="businessId" value={businessId} />
      {state?.error && <p className="sm:col-span-3 text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="sm:col-span-3 text-sm text-emerald-400">{state.success}</p>}
      <input
        name="amount"
        type="number"
        step="0.01"
        min="0"
        required
        placeholder="Amount received"
        className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
      />
      <input
        name="note"
        placeholder="Note (optional)"
        className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
      />
      <SubmitButton className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
        Record payment & renew
      </SubmitButton>
    </form>
  );
}

export function StaffAdminTable({ staff }: { staff: StaffRow[] }) {
  const [, startTransition] = useTransition();
  const [resetTarget, setResetTarget] = useState<StaffRow | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last login</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-300">
          {staff.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium text-white">{s.name}</td>
              <td className="px-4 py-3">{s.email}</td>
              <td className="px-4 py-3 capitalize">{s.role}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    s.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.lastLoginAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setResetTarget(s)}
                    className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-500/60"
                  >
                    Reset password
                  </button>
                  <button
                    onClick={() => startTransition(() => toggleUserStatusPlatformAction(s.id))}
                    className={`rounded-md border px-2.5 py-1 text-xs ${
                      s.status === "active"
                        ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                        : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                    }`}
                  >
                    {s.status === "active" ? "Disable" : "Enable"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Reset password</h3>
              <button onClick={() => setResetTarget(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              For {resetTarget.name} ({resetTarget.email})
            </p>
            <ResetForm userId={resetTarget.id} onDone={() => setResetTarget(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ResetForm({ userId, onDone }: { userId: number; onDone: () => void }) {
  const [state, formAction] = useActionState(resetOwnerPasswordAction, emptyState);
  return (
    <div className="mt-4">
      {state?.error && <p className="mb-2 text-xs text-red-400">{state.error}</p>}
      {state?.success ? (
        <div>
          <p className="text-sm text-emerald-400">{state.success}</p>
          <button onClick={onDone} className="mt-3 text-xs text-slate-400 hover:text-slate-200">
            Close
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <input
            name="newPassword"
            type="password"
            minLength={8}
            required
            placeholder="New password"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
          />
          <SubmitButton pendingText="Updating…">Update password</SubmitButton>
        </form>
      )}
    </div>
  );
}
