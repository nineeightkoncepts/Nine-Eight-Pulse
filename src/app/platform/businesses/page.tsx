import Link from "next/link";
import { ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { planLabel } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function PlatformBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  let rows = await db
    .select()
    .from(businesses)
    .where(q ? or(ilike(businesses.name, `%${q}%`), ilike(businesses.email, `%${q}%`)) : sql`true`);

  if (status) {
    rows = rows.filter((b) => b.status === status);
  }
  rows = [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All businesses</h1>
        <p className="mt-1 text-sm text-slate-400">Every business subscribed to Nine Eight Pulse.</p>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500"
        >
          <option value="">All statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-300">
            {rows.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.email}</p>
                </td>
                <td className="px-4 py-3">{planLabel(b.plan)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                      b.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : b.status === "trial"
                          ? "bg-sky-500/10 text-sky-400"
                          : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(b.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/platform/businesses/${b.id}`}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-500/60"
                  >
                    View & manage
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No businesses match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
