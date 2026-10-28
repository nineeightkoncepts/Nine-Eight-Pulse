"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions/auth-actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: ActionState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {state?.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Email address</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@business.com"
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-slate-400">
        New business?{" "}
        <Link href="/register" className="font-medium text-amber-400 hover:text-amber-300">
          Start your free trial
        </Link>
      </p>
    </form>
  );
}
