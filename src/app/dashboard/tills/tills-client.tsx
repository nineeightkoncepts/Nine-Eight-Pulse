"use client";

import { useActionState, useTransition } from "react";
import { createTillAction, forceCloseSessionAction, toggleTillActiveAction } from "@/lib/actions/tills-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime, formatMoney } from "@/lib/format";

const emptyState: ActionState = {};

interface TillRow {
  id: number;
  name: string;
  status: "open" | "closed";
  isActive: boolean;
}

interface OpenSessionRow {
  id: number;
  tillName: string;
  userName: string;
  openingCash: string;
  openedAt: Date | string;
  salesSoFar: number;
}

interface HistorySessionRow {
  id: number;
  tillName: string;
  userName: string;
  openingCash: string;
  closingCash: string | null;
  expectedCash: string | null;
  cashDifference: string | null;
  openedAt: Date | string;
  closedAt: Date | string | null;
}

export function TillsClient({
  tills,
  openSessions,
  history,
  currency,
  canManage,
}: {
  tills: TillRow[];
  openSessions: OpenSessionRow[];
  history: HistorySessionRow[];
  currency: string;
  canManage: boolean;
}) {
  const [state, formAction] = useActionState(createTillAction, emptyState);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      {canManage && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Create a new till</h2>
          <p className="mt-1 text-sm text-slate-400">
            Tills represent a physical or virtual register your staff open each shift.
          </p>
          {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
          {state?.success && <p className="mt-3 text-sm text-emerald-400">{state.success}</p>}
          <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              name="name"
              required
              placeholder="e.g. Patio Till, Bar Till 2"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
            />
            <SubmitButton className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400">
              Create till
            </SubmitButton>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white">All tills</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tills.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{t.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    t.status === "open" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700/30 text-slate-400"
                  }`}
                >
                  {t.status === "open" ? "In use" : "Available"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{t.isActive ? "Active" : "Deactivated"}</p>
              {canManage && (
                <button
                  onClick={() => startTransition(() => toggleTillActiveAction(t.id))}
                  className="mt-4 w-full rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500"
                >
                  {t.isActive ? "Deactivate" : "Reactivate"}
                </button>
              )}
            </div>
          ))}
          {tills.length === 0 && <p className="text-sm text-slate-500">No tills created yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Currently open sessions</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Till</th>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Opening cash</th>
                <th className="px-4 py-3">Sales so far</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-300">
              {openSessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-white">{s.tillName}</td>
                  <td className="px-4 py-3">{s.userName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.openedAt)}</td>
                  <td className="px-4 py-3">{formatMoney(s.openingCash, currency)}</td>
                  <td className="px-4 py-3">{formatMoney(s.salesSoFar, currency)}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Force close ${s.tillName}'s session for ${s.userName}?`)) {
                            startTransition(() => forceCloseSessionAction(s.id));
                          }
                        }}
                        className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        Force close
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {openSessions.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-slate-500">
                    No tills are currently open.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Session history</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Till</th>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3">Expected cash</th>
                <th className="px-4 py-3">Closing cash</th>
                <th className="px-4 py-3">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-300">
              {history.map((s) => {
                const diff = Number(s.cashDifference ?? 0);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-white">{s.tillName}</td>
                    <td className="px-4 py-3">{s.userName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.openedAt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.closedAt)}</td>
                    <td className="px-4 py-3">{formatMoney(s.expectedCash ?? "0", currency)}</td>
                    <td className="px-4 py-3">{formatMoney(s.closingCash ?? "0", currency)}</td>
                    <td className={`px-4 py-3 font-medium ${diff === 0 ? "text-slate-400" : diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {diff > 0 ? "+" : ""}
                      {formatMoney(diff, currency)}
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    No closed sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
