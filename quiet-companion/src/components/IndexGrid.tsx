import type { IndexQuote } from '../types';

export function IndexGrid({ indices }: { indices: IndexQuote[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Top markets</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="live-dot" aria-hidden="true" /> Live
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 lg:grid-cols-5">
        {indices.map((index) => {
          const up = index.changePercent >= 0;
          return (
            <div key={index.symbol} className="row-hover p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{index.symbol}</span>
                <span
                  className={`nums rounded-full px-2 py-0.5 text-xs font-medium ${up ? 'pill-up' : 'pill-down'}`}
                >
                  {up ? '+' : ''}
                  {index.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="nums mt-2 text-xl font-semibold tracking-tight text-slate-900">
                {index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="truncate text-xs text-slate-500">{index.name}</span>
                <span className={`nums text-xs ${up ? 'up' : 'down'}`}>
                  {up ? '+' : ''}
                  {index.change.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
