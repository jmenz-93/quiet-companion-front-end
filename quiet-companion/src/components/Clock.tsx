import { useEffect, useState } from 'react';

// Small, calm market-status indicator with a live New York clock.
export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  }).format(now);

  // NYSE regular session: 09:30–16:00 ET, Mon–Fri.
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
    timeZone: 'America/New_York'
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const isWeekday = !['Sat', 'Sun'].includes(weekday);
  const minutes = hour * 60 + minute;
  const isOpen = isWeekday && minutes >= 570 && minutes < 960;

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
      {isOpen ? (
        <span className="live-dot" aria-hidden="true" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      )}
      <span className="text-xs font-medium text-slate-600">{isOpen ? 'Markets open' : 'Markets closed'}</span>
      <span className="nums text-xs text-slate-400">·</span>
      <span className="nums text-xs font-medium text-slate-500">{time} ET</span>
    </div>
  );
}
