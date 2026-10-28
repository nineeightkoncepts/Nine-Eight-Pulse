"use client";

import { useTransition } from "react";
import { voidOrderAction } from "@/lib/actions/pos-actions";

export function VoidButton({ orderId, disabled }: { orderId: number; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  if (disabled) return <span className="text-xs text-slate-600">—</span>;

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Void this order? Stock will be restored.")) {
          startTransition(() => voidOrderAction(orderId));
        }
      }}
      className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
    >
      {pending ? "Voiding…" : "Void"}
    </button>
  );
}
