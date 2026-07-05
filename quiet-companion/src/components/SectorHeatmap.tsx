import type { SectorPerformance } from '../types';

export function SectorHeatmap({ sectors }: { sectors: SectorPerformance[] }) {
  const max = Math.max(1, ...sectors.map((s) => Math.abs(s.changePercent)));

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Sector performance</h2>
        <span className="text-xs text-slate-400">% change today</span>
      </div>
      <div className="card-pad space-y-3">
        {sectors.map((sector) => {
          const up = sector.changePercent >= 0;
          // Each side of the center line only has half the track, so the
          // largest move fills at most 50% (not 100%) to stay inside the box.
          const width = `${(Math.abs(sector.changePercent) / max) * 50}%`;
          return (
            <div key={sector.name} className="grid grid-cols-[130px_1fr_56px] items-center gap-3">
              <span className="truncate text-sm text-slate-600">{sector.name}</span>
              {/* Diverging bar: fills left of center for down, right for up */}
              <div className="relative h-2 rounded-full bg-slate-100">
                <div className="absolute left-1/2 top-0 h-full w-px bg-slate-200" />
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    width,
                    background: up ? 'var(--up)' : 'var(--down)',
                    left: up ? '50%' : undefined,
                    right: up ? undefined : '50%'
                  }}
                />
              </div>
              <span className={`nums text-right text-sm font-medium ${up ? 'up' : 'down'}`}>
                {up ? '+' : ''}
                {sector.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
