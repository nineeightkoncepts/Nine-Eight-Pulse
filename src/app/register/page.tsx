import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <BrandLockup size="md" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-black/40">
          <h1 className="text-lg font-semibold text-white">Start your free 14-day trial</h1>
          <p className="mt-1 mb-6 text-sm text-slate-400">
            Set up your restaurant or bar on Nine Eight Pulse in under two minutes.
          </p>
          <RegisterForm defaultPlan={plan ?? "starter"} />
        </div>
      </div>
    </main>
  );
}
