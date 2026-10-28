"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { openTillSessionAction } from "@/lib/actions/tills-actions";

interface TillOption {
  id: number;
  name: string;
}

export function TillSelector({ tills }: { tills: TillOption[] }) {
  const [selected, setSelected] = useState<TillOption | null>(null);
  const [openingCash, setOpeningCash] = useState("0.00");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await openTillSessionAction(selected.id, Number(openingCash) || 0);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-white">Open a till to start selling</h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        Choose an available till and count your starting cash drawer.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tills.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className={`rounded-2xl border p-6 text-left transition ${
              selected?.id === t.id
                ? "border-amber-500 bg-amber-500/10"
                : "border-slate-800 bg-slate-900/50 hover:border-slate-600"
            }`}
          >
            <p className="text-lg font-semibold text-white">{t.name}</p>
            <p className="mt-1 text-xs text-emerald-400">Available</p>
          </button>
        ))}
        {tills.length === 0 && (
          <p className="col-span-2 text-center text-sm text-slate-500">
            No tills are available right now — ask your manager to create or free one up.
          </p>
        )}
      </div>

      {selected && (
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Opening cash in drawer for {selected.name}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            onClick={submit}
            disabled={pending}
            className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Opening till…" : `Open ${selected.name}`}
          </button>
        </div>
      )}
    </div>
  );
}
