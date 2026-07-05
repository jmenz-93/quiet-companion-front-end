import type { StockQuote } from '../types';

function MoverRow({ stock }: { stock: StockQuote }) {
  const up = stock.change >= 0;
  return (
    <div className="row-hover flex items-center justify-between px-5 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800">{stock.symbol}</div>
        <div className="truncate text-xs text-slate-500">{stock.name}</div>
      </div>
      <div className="text-right">
        <div className="nums text-sm text-slate-800">{stock.price.toFixed(2)}</div>
        <div className={`nums text-xs font-medium ${up ? 'up' : 'down'}`}>
          {up ? '+' : ''}
          {stock.changePercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export function MoversPanel({ stocks }: { stocks: StockQuote[] }) {
  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.slice(0, 4);
  const losers = sorted.slice(-4).reverse();

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Today's movers</h2>
      </div>
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div>
          <div className="px-5 pt-3 text-xs font-medium text-up">Gainers</div>
          <div className="mt-1 divide-y divide-slate-100">
            {gainers.map((stock) => (
              <MoverRow key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
        <div>
          <div className="px-5 pt-3 text-xs font-medium text-down">Decliners</div>
          <div className="mt-1 divide-y divide-slate-100">
            {losers.map((stock) => (
              <MoverRow key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
