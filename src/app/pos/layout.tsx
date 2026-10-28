import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusinessSession } from "@/lib/session-helpers";
import { BrandLockup } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";

export default async function PosLayout({ children }: { children: ReactNode }) {
  const session = await requireBusinessSession();

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-900 bg-slate-950/90 px-5 py-3">
        <Link href="/pos">
          <BrandLockup size="sm" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{session.name}</p>
            <p className="text-xs capitalize text-slate-500">{session.role}</p>
          </div>
          {(session.role === "owner" || session.role === "manager") && (
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500"
            >
              Back to dashboard
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
