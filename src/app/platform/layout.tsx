import type { ReactNode } from "react";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/session-helpers";
import { BrandLockup } from "@/components/brand";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";

const items: NavItem[] = [
  { href: "/platform", label: "Overview", icon: "🧭" },
  { href: "/platform/businesses", label: "Businesses", icon: "🏢" },
];

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-900 bg-slate-950/80 p-5 lg:flex">
        <Link href="/platform" className="mb-8">
          <BrandLockup size="sm" />
        </Link>
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
          System Owner Console
        </p>
        <DashboardNav items={items} />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-900 bg-slate-950/60 px-6 py-4 lg:px-8">
          <div>
            <p className="text-sm text-slate-400">
              Signed in as <span className="font-medium text-white">{session.name}</span>
            </p>
            <p className="text-xs text-slate-500">Nine Eight Koncepts platform administrator</p>
          </div>
          <LogoutButton />
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
