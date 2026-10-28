import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <BrandLockup size="md" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-black/40">
          <h1 className="text-lg font-semibold text-white">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-slate-400">Sign in to manage your till, staff, and sales.</p>
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          System owner?{" "}
          <span className="text-slate-400">Use your Nine Eight Koncepts platform credentials above.</span>
        </p>
      </div>
    </main>
  );
}
