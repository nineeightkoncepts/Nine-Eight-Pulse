import type { ReactNode } from "react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireBusinessSession } from "@/lib/session-helpers";
import { BrandLockup } from "@/components/brand";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { planLabel } from "@/lib/plans";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireBusinessSession();
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, session.businessId));

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
    { href: "/dashboard/tills", label: "Tills", icon: "🧾" },
    { href: "/dashboard/reports", label: "Reports", icon: "📈" },
  ];
  if (session.role === "owner" || session.role === "manager") {
    items.splice(3, 0, { href: "/dashboard/staff", label: "Staff", icon: "👥" });
  }
  if (session.role === "owner") {
    items.push({ href: "/dashboard/settings", label: "Settings", icon: "⚙️" });
  }
  items.push({ href: "/pos", label: "Open POS", icon: "🛒" });

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-900 bg-slate-950/80 p-5 lg:flex">
        <Link href="/dashboard" className="mb-8">
          <BrandLockup size="sm" />
        </Link>
        <DashboardNav items={items} />
        <div className="mt-auto space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="truncate text-sm font-semibold text-white">{biz?.name ?? "Your business"}</p>
          <p className="text-xs text-slate-500">
            Plan: <span className="text-amber-400">{biz ? planLabel(biz.plan) : "—"}</span>
          </p>
          <p className="text-xs capitalize text-slate-500">Status: {biz?.status}</p>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-slate-900 bg-slate-950/80 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <BrandLockup size="sm" />
            <LogoutButton />
          </div>
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300"
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        </header>
        <header className="hidden items-center justify-between border-b border-slate-900 bg-slate-950/60 px-8 py-4 lg:flex">
          <div>
            <p className="text-sm text-slate-400">
              Welcome back, <span className="font-medium text-white">{session.name}</span>
            </p>
            <p className="text-xs capitalize text-slate-500">{session.role} account</p>
          </div>
          <LogoutButton />
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
