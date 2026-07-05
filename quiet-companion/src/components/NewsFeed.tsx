import type { MarketArticle } from '../types';

export function NewsFeed({ articles }: { articles: MarketArticle[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Market news</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="live-dot" aria-hidden="true" /> Updated live
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading the latest headlines…</div>
        ) : (
          articles.map((article) => (
            <article key={article.id} className="row-hover px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-brand-600">{article.source}</span>
                <span aria-hidden="true">·</span>
                <span className="nums">{article.timestamp}</span>
              </div>
              <h3 className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-slate-900">{article.headline}</h3>
              {article.summary ? (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{article.summary}</p>
              ) : null}
              {article.tickers.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {article.tickers.slice(0, 5).map((ticker) => (
                    <span
                      key={ticker}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
