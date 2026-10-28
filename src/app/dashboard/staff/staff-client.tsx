"use client";

import { useActionState, useState, useTransition } from "react";
import { createStaffAction, resetStaffPasswordAction, toggleStaffStatusAction } from "@/lib/actions/staff-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime } from "@/lib/format";

const emptyState: ActionState = {};

interface StaffRow {
  id: number;
  name: string;
  email: string;
  role: "owner" | "manager" | "cashier";
  status: "active" | "disabled";
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
}

export function StaffClient({ staff, currentRole }: { staff: StaffRow[]; currentRole: "owner" | "manager" }) {
  const [createState, createAction] = useActionState(createStaffAction, emptyState);
  const [resetTarget, setResetTarget] = useState<StaffRow | null>(null);
  const [, startTransition] = useTransition();

  const roleBadge = (role: string) =>
    ({
      owner: "bg-amber-500/10 text-amber-400",
      manager: "bg-sky-500/10 text-sky-400",
      cashier: "bg-slate-700/30 text-slate-300",
    })[role] ?? "bg-slate-700/30 text-slate-300";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Add a staff account</h2>
        <p className="mt-1 text-sm text-slate-400">
          {currentRole === "owner"
            ? "Create manager or cashier accounts for your team."
            : "You can create cashier accounts for your team."}
        </p>
        {createState?.error && <p className="mt-3 text-sm text-red-400">{createState.error}</p>}
        {createState?.success && <p className="mt-3 text-sm text-emerald-400">{createState.success}</p>}
        <form action={createAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            name="name"
            required
            placeholder="Full name"
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 lg:col-span-1"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 lg:col-span-1"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Temporary password"
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 lg:col-span-1"
          />
          <select
            name="role"
            className="rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 lg:col-span-1"
          >
            {currentRole === "owner" && <option value="manager">Manager</option>}
            <option value="cashier">Cashier</option>
          </select>
          <SubmitButton className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 lg:col-span-1">
            Create account
          </SubmitButton>
        </form>
      </div>

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
            {staff.map((s) => {
              const manageable = !(s.role === "owner") && !(currentRole === "manager" && s.role !== "cashier");
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${roleBadge(s.role)}`}>{s.role}</span>
                  </td>
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
                    {manageable ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setResetTarget(s)}
                          className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-amber-500/60"
                        >
                          Reset password
                        </button>
                        <button
                          onClick={() => startTransition(() => toggleStaffStatusAction(s.id))}
                          className={`rounded-md border px-2.5 py-1 text-xs ${
                            s.status === "active"
                              ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                              : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                          }`}
                        >
                          {s.status === "active" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {resetTarget && (
        <ResetPasswordModal staff={resetTarget} onClose={() => setResetTarget(null)} />
      )}
    </div>
  );
}

function ResetPasswordModal({ staff, onClose }: { staff: StaffRow; onClose: () => void }) {
  const [state, formAction] = useActionState(resetStaffPasswordAction, emptyState);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Reset password</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
        <p className="mt-1 text-sm text-slate-400">For {staff.name} ({staff.email})</p>
        {state?.error && <p className="mt-3 text-xs text-red-400">{state.error}</p>}
        {state?.success ? (
          <p className="mt-3 text-sm text-emerald-400">{state.success}</p>
        ) : (
          <form action={formAction} className="mt-4 space-y-3">
            <input type="hidden" name="userId" value={staff.id} />
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
    </div>
  );
}
