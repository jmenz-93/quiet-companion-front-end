export function BrandMark({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
        {/* Simple, friendly "leaf/growth" mark */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 20c0-7 5.5-13 15-13-1 8-6.5 12-12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M7 17c3-4 6-6 10-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[0.95rem] font-semibold tracking-tight text-slate-900">Quiet Companion</div>
        {subtitle ? <div className="text-[0.7rem] text-slate-500">Advisor workspace</div> : null}
      </div>
    </div>
  );
}
