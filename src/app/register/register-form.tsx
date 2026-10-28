"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerBusinessAction, type ActionState } from "@/lib/actions/auth-actions";
import { SubmitButton } from "@/components/submit-button";
import { PLAN_LIST } from "@/lib/plans";

const initialState: ActionState = {};

export function RegisterForm({ defaultPlan }: { defaultPlan: string }) {
  const [state, formAction] = useActionState(registerBusinessAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Business name</label>
          <input
            name="businessName"
            required
            placeholder="The Daily Grind Bar & Grill"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Business type</label>
          <select
            name="businessType"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          >
            <option value="restaurant">Restaurant</option>
            <option value="bar">Bar / Pub</option>
            <option value="cafe">Café / Coffee shop</option>
            <option value="food_truck">Food truck</option>
            <option value="nightclub">Nightclub / Lounge</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Your full name</label>
          <input
            name="ownerName"
            required
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Phone</label>
          <input
            name="phone"
            placeholder="+1 555 010 2030"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Work email</label>
        <input
          name="email"
          type="email"
          required
          placeholder="owner@yourbusiness.com"
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Confirm password</label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            placeholder="Re-enter password"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Choose a plan</label>
        <select
          name="plan"
          defaultValue={defaultPlan}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        >
          {PLAN_LIST.map((plan) => (
            <option key={plan.key} value={plan.key}>
              {plan.name} — ${plan.monthlyPrice}/mo
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          All plans start with a 14-day free trial. No card required to begin.
        </p>
      </div>
      <SubmitButton pendingText="Creating your account…">Create my business account</SubmitButton>
      <p className="text-center text-sm text-slate-400">
        Already using Nine Eight Pulse?{" "}
        <Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">
          Sign in
        </Link>
      </p>
    </form>
  );
}
