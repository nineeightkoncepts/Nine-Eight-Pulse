import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { PLAN_LIST } from "@/lib/plans";

const FEATURES = [
  {
    title: "Smart Inventory",
    desc: "Add, edit and track every ingredient, drink and dish. Get low-stock alerts before you run out.",
    icon: "📦",
  },
  {
    title: "Till Management",
    desc: "Spin up unlimited tills per location, assign workers, and reconcile cash at the end of every shift.",
    icon: "🧾",
  },
  {
    title: "Role-based Access",
    desc: "Owners, managers and cashiers each get the right level of access — nothing more, nothing less.",
    icon: "🔐",
  },
  {
    title: "Real-time Reporting",
    desc: "See sales by staff, by till, or by item — in real time, from any device.",
    icon: "📊",
  },
  {
    title: "Built for Hospitality",
    desc: "Purpose-built workflows for restaurants, bars, cafés, food trucks and nightclubs.",
    icon: "🍽️",
  },
  {
    title: "Multi-business Control",
    desc: "Running more than one venue? Nine Eight Koncepts gives platform owners full oversight.",
    icon: "🏢",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandLockup size="md" />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#about" className="hover:text-white">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Start free trial
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center"
        >
          <div className="h-[36rem] w-[60rem] rounded-full bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-rose-700/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs font-medium text-amber-400">
            Now onboarding restaurants, bars &amp; lounges
          </span>
          <h1 className="mt-6 text-[clamp(2.25rem,6vw,4.25rem)] font-bold leading-[1.05] tracking-tight text-white">
            The point of sale built for the pulse of <span className="text-amber-400">hospitality.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Nine Eight Pulse helps restaurants, bars and hospitality businesses manage inventory, tills,
            staff and sales from one powerful subscription platform — built and powered by Nine Eight Koncepts.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-xl bg-amber-500 px-8 py-3.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-amber-400 sm:w-auto"
            >
              Start your 14-day free trial
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-slate-700 px-8 py-3.5 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 sm:w-auto"
            >
              Sign in to your account
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">No credit card required · Cancel anytime</p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-2xl shadow-black/40">
          <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-950/60 p-6 sm:grid-cols-3">
            {[
              { label: "Avg. checkout time", value: "< 12s" },
              { label: "Inventory accuracy", value: "99.4%" },
              { label: "Businesses onboarded", value: "500+" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-center">
                <p className="text-2xl font-bold text-amber-400">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">Everything your venue needs to run smoothly</h2>
          <p className="mt-3 text-slate-400">
            From the front counter to the back office, Nine Eight Pulse keeps every shift, sale and staff
            member in sync.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-amber-500/40 hover:bg-slate-900/70"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles explainer */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-white">Built around how your team actually works</h2>
            <p className="mt-4 text-slate-400">
              Every account on Nine Eight Pulse has the right privileges for the job — from the system
              owner who oversees every subscribed business, down to the cashier ringing up the next order.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>🏳️ <strong className="text-white">System Owner</strong> — Nine Eight Koncepts oversees every business on the platform, subscriptions and billing.</li>
              <li>👑 <strong className="text-white">Business Owner</strong> — Full control of their venue: inventory, tills, staff and settings.</li>
              <li>🧑‍💼 <strong className="text-white">Manager</strong> — Runs daily operations: inventory, tills and reporting.</li>
              <li>🧑‍🍳 <strong className="text-white">Cashier / Worker</strong> — Opens a till and processes sales on the POS floor.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-xs uppercase tracking-widest text-amber-400">Why businesses switch</p>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <p>"We finally know exactly who sold what, on which till, during every shift."</p>
              <p className="text-slate-500">— Owner, multi-location bar group</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">Simple, transparent subscription pricing</h2>
          <p className="mt-3 text-slate-400">Every plan includes a 14-day free trial. Upgrade or downgrade anytime.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {PLAN_LIST.map((plan, i) => (
            <div
              key={plan.key}
              className={`flex flex-col rounded-2xl border p-6 ${
                i === 1
                  ? "border-amber-500 bg-slate-900 shadow-xl shadow-amber-900/20"
                  : "border-slate-800 bg-slate-900/40"
              }`}
            >
              {i === 1 && (
                <span className="mb-3 inline-block w-fit rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-950">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold text-white">
                ${plan.monthlyPrice}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-400">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/register?plan=${plan.key}`}
                className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                  i === 1
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                    : "border border-slate-700 text-slate-200 hover:border-slate-500"
                }`}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-900 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <BrandLockup size="sm" />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Nine Eight Koncepts. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
