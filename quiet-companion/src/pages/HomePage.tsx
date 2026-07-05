import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMarketSnapshot } from '../lib/api';
import type { IndexQuote, MarketArticle, SectorPerformance, StockQuote } from '../types';
import { useAuth } from '../context/AuthContext';
import { TerminalHeader } from '../components/TerminalHeader';
import { IndexGrid } from '../components/IndexGrid';
import { StockTable } from '../components/StockTable';
import { MoversPanel } from '../components/MoversPanel';
import { SectorHeatmap } from '../components/SectorHeatmap';
import { NewsFeed } from '../components/NewsFeed';

export function HomePage() {
  const { advisor } = useAuth();
  const [articles, setArticles] = useState<MarketArticle[]>([]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [sectors, setSectors] = useState<SectorPerformance[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  // Data is loaded once on mount and otherwise only when the advisor asks for
  // it — no background polling, to stay well within the market API's quota.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketSnapshot();
      if (!mounted.current) {
        return;
      }
      setArticles(data.articles);
      setStocks(data.stocks);
      setIndices(data.indices);
      setSectors(data.sectors);
      setUpdatedAt(new Date());
    } catch {
      // Leave the last snapshot in place on a failed refresh.
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const firstName = advisor?.name.split(' ')[0] ?? 'there';
  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(updatedAt)
    : null;

  return (
    <div className="min-h-screen">
      <TerminalHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Good morning, {firstName}</h1>
            <p className="mt-1 text-sm text-slate-500">Here's a calm read on the markets to start your day.</p>
          </div>
          <div className="flex items-center gap-3">
            {updatedLabel ? <span className="text-xs text-slate-400">Updated {updatedLabel}</span> : null}
            <button
              onClick={load}
              disabled={loading}
              className="focusable inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className={loading ? 'animate-spin' : undefined}
              >
                <path
                  d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <IndexGrid indices={indices} />

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              <SectorHeatmap sectors={sectors} />
              <MoversPanel stocks={stocks} />
            </div>
            <StockTable stocks={stocks} />
          </div>

          <NewsFeed articles={articles} />
        </div>

        <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row">
          <span>Quiet Companion · For advisor use only</span>
          <span>Quotes may be delayed · Not investment advice</span>
        </footer>
      </main>
    </div>
  );
}
