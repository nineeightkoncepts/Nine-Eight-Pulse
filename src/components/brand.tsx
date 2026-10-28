export function PulseMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      className={`${className} relative grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 shadow-lg shadow-orange-900/30`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
        <path
          d="M2 12h4l2-7 4 14 2-7h8"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BrandLockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const title = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  const mark = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <div className="flex items-center gap-3">
      <PulseMark className={mark} />
      <div className="leading-tight">
        <p className={`font-bold tracking-tight text-white ${title}`}>
          Nine Eight <span className="text-amber-400">Pulse</span>
        </p>
        {size !== "sm" && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Powered by Nine Eight Koncepts
          </p>
        )}
      </div>
    </div>
  );
}
