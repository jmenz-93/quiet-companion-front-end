import type { StockQuote } from '../types';
import { Sparkline } from './Sparkline';

export function StockTable({ stocks }: { stocks: StockQuote[] }) {
  return (
    <section className="card flex h-full flex-col">
      <div className="card-head">
        <h2 className="card-title">Top stocks</h2>
        <span className="text-xs text-slate-400">US equities</span>
      </div>

      <div className="grid grid-cols-[1.7fr_1fr_0.9fr_1fr] gap-3 px-5 py-2.5 text-xs font-medium text-slate-400">
        <span>Company</span>
        <span className="text-right">Price</span>
        <span className="text-right">Change</span>
        <span className="text-right">30d</span>
      </div>

      <div className="slim-scroll flex-1 divide-y divide-slate-100">
        {stocks.map((stock) => {
          const up = stock.change >= 0;
          return (
            <div
              key={stock.symbol}
              className="row-hover grid grid-cols-[1.7fr_1fr_0.9fr_1fr] items-center gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">{stock.symbol}</div>
                <div className="truncate text-xs text-slate-500">{stock.name}</div>
              </div>
              <div className="nums text-right text-sm text-slate-800">
                {stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`nums text-right text-sm font-medium ${up ? 'up' : 'down'}`}>
                {up ? '+' : ''}
                {stock.changePercent.toFixed(2)}%
              </div>
              <div className="flex justify-end">
                <Sparkline data={stock.spark} positive={up} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
