import { logoutAction } from "@/lib/actions/auth-actions";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ||
          "rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-300"
        }
      >
        Sign out
      </button>
    </form>
  );
}
