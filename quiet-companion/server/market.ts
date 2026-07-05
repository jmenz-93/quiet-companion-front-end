import type { IndexQuote, SectorPerformance, StockQuote } from '../src/types';

// ---------------------------------------------------------------------------
// Twelve Data market feed.
//
// Free tier reality (as of writing): 8 API credits/minute, 800 credits/day,
// and each symbol in a request costs 1 credit. That is far too little to
// refresh ~30 symbols at once (a single 30-symbol call is instantly rejected),
// so we:
//   1. Keep one flat list of every symbol we want live.
//   2. Each refresh tick, fetch only the NEXT chunk of <=8 symbols and merge
//      the results into a persistent map, rotating through the list.
//   3. Overlay those live values on baseline demo values, so every card shows
//      either real data (once fetched) or a sensible placeholder — never blank.
//   4. Live values persist, so if the daily quota is exhausted the page keeps
//      showing the last real quotes rather than reverting to demo numbers.
//   5. Sparklines are drawn synthetically from the real % change; fetching real
//      history would cost an extra credit per symbol and blow the 8/min budget.
// ---------------------------------------------------------------------------

const API = 'https://api.twelvedata.com';
const apiKey = process.env.TWELVE_DATA_API_KEY;
// How often we may fetch one chunk. Gates credit burn against the daily cap.
const refreshIntervalMs = Number(process.env.MARKET_CACHE_TTL_MS ?? 60_000);
// Symbols per chunk — keep at/below the free tier's 8 credits/minute.
const maxSymbolsPerRefresh = Number(process.env.MARKET_MAX_SYMBOLS_PER_REFRESH ?? 8);

export type MarketData = {
  indices: IndexQuote[];
  stocks: StockQuote[];
  sectors: SectorPerformance[];
};

// ---- Synthetic sparkline (fallback + default) ------------------------------

function seeded(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function hashSymbol(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

// A plausible intraday shape that ends in a direction matching the real move.
function buildSpark(symbol: string, changePercent: number, points = 30): number[] {
  const rand = seeded(hashSymbol(symbol) + Math.floor(Date.now() / 1000 / 300));
  const drift = changePercent / 100 / points;
  const series: number[] = [];
  let value = 100;
  for (let i = 0; i < points; i += 1) {
    const noise = (rand() - 0.5) * 0.9;
    value = value * (1 + drift) + noise;
    series.push(Number(value.toFixed(3)));
  }
  return series;
}

function formatVolume(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return '—';
  }
  if (n >= 1e9) {
    return `${(n / 1e9).toFixed(1)}B`;
  }
  if (n >= 1e6) {
    return `${(n / 1e6).toFixed(1)}M`;
  }
  if (n >= 1e3) {
    return `${(n / 1e3).toFixed(1)}K`;
  }
  return String(Math.round(n));
}

// ---- Symbol definitions (also serve as fallback values) --------------------
// `td` is the Twelve Data symbol; entries without `td` stay mock-only (e.g.
// bond yields aren't on the free tier).

type IndexDef = IndexQuote & { td?: string };

const indexDefs: IndexDef[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 5482.19, change: 22.41, changePercent: 0.41, td: 'SPX' },
  { symbol: 'NDX', name: 'Nasdaq 100', value: 19764.02, change: 138.6, changePercent: 0.71, td: 'NDX' },
  { symbol: 'INDU', name: 'Dow Jones', value: 39411.21, change: -84.12, changePercent: -0.21, td: 'DJI' },
  { symbol: 'RUT', name: 'Russell 2000', value: 2042.55, change: 6.18, changePercent: 0.3, td: 'RUT' },
  { symbol: 'VIX', name: 'Volatility', value: 13.84, change: -0.22, changePercent: -1.56, td: 'VIX' },
  { symbol: 'UST10Y', name: 'US 10Y Yield', value: 4.21, change: 0.03, changePercent: 0.72 },
  { symbol: 'DXY', name: 'US Dollar', value: 105.62, change: 0.14, changePercent: 0.13, td: 'DXY' },
  { symbol: 'XAU', name: 'Gold (spot)', value: 2331.4, change: 9.8, changePercent: 0.42, td: 'XAU/USD' },
  { symbol: 'CL', name: 'WTI Crude', value: 81.74, change: -0.63, changePercent: -0.76, td: 'WTI/USD' },
  { symbol: 'BTC', name: 'Bitcoin', value: 61240.0, change: 812.0, changePercent: 1.34, td: 'BTC/USD' }
];

type StockDef = Omit<StockQuote, 'spark'>;

const stockDefs: StockDef[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 218.44, change: 2.19, changePercent: 1.01, volume: '43.2M' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 452.88, change: 4.03, changePercent: 0.9, volume: '19.8M' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 128.44, change: 3.61, changePercent: 2.89, volume: '288.4M' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 193.61, change: 1.12, changePercent: 0.58, volume: '31.7M' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 183.02, change: -0.94, changePercent: -0.51, volume: '18.2M' },
  { symbol: 'META', name: 'Meta Platforms', price: 504.22, change: 6.71, changePercent: 1.35, volume: '13.9M' },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 202.11, change: 0.88, changePercent: 0.44, volume: '9.1M' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 411.9, change: -1.4, changePercent: -0.34, volume: '3.4M' },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 114.28, change: -1.02, changePercent: -0.88, volume: '15.6M' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 246.39, change: 8.44, changePercent: 3.55, volume: '112.7M' }
];

// Sector performance is derived from the SPDR sector ETFs.
type SectorDef = { name: string; td: string; changePercent: number };

const sectorDefs: SectorDef[] = [
  { name: 'Technology', td: 'XLK', changePercent: 1.24 },
  { name: 'Comm. Services', td: 'XLC', changePercent: 0.86 },
  { name: 'Financials', td: 'XLF', changePercent: 0.51 },
  { name: 'Health Care', td: 'XLV', changePercent: 0.22 },
  { name: 'Industrials', td: 'XLI', changePercent: 0.08 },
  { name: 'Utilities', td: 'XLU', changePercent: -0.14 },
  { name: 'Materials', td: 'XLB', changePercent: -0.33 },
  { name: 'Real Estate', td: 'XLRE', changePercent: -0.47 },
  { name: 'Cons. Staples', td: 'XLP', changePercent: -0.19 },
  { name: 'Energy', td: 'XLE', changePercent: -0.82 }
];

// ---- Twelve Data fetchers --------------------------------------------------

type QuoteData = { price: number; change: number; percentChange: number; volume: number };

type RawQuote = {
  status?: string;
  close?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
};

async function fetchQuotes(symbols: string[]): Promise<Map<string, QuoteData>> {
  const out = new Map<string, QuoteData>();
  if (!apiKey || symbols.length === 0) {
    return out;
  }

  const url = `${API}/quote?symbol=${encodeURIComponent(symbols.join(','))}&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Twelve Data quote request failed with status ${response.status}`);
  }

  const json = (await response.json()) as Record<string, RawQuote> & { status?: string; message?: string };
  // A top-level error (e.g. rate limit) applies to the whole request.
  if (json?.status === 'error') {
    throw new Error(json.message ?? 'Twelve Data returned an error');
  }

  // A single-symbol request returns the quote object directly; a batch is keyed by symbol.
  const entries = (symbols.length === 1 ? { [symbols[0]]: json } : json) as Record<string, RawQuote>;

  for (const symbol of symbols) {
    const quote = entries[symbol];
    if (!quote || quote.status === 'error') {
      continue;
    }
    const price = Number(quote.close);
    if (!Number.isFinite(price)) {
      continue;
    }
    out.set(symbol, {
      price,
      change: Number(quote.change),
      percentChange: Number(quote.percent_change),
      volume: Number(quote.volume)
    });
  }

  return out;
}

// ---- Rotating fetch + live cache -------------------------------------------

// Every Twelve Data symbol we want live, de-duplicated. We rotate through this
// list a chunk at a time so each refresh stays within the per-minute budget.
const fetchPlan: string[] = Array.from(
  new Set<string>([
    ...indexDefs.filter((index) => index.td).map((index) => index.td as string),
    ...stockDefs.map((stock) => stock.symbol),
    ...sectorDefs.map((sector) => sector.td)
  ])
);

// Persistent store of the latest real quote per Twelve Data symbol. Values
// survive across refreshes, so exhausting the daily quota just means quotes
// stop updating — the page still shows the last real numbers.
const liveQuotes = new Map<string, QuoteData>();

let cursor = 0;
let lastRefresh = 0;
let inFlight: Promise<void> | null = null;

async function refreshChunk(): Promise<void> {
  if (!apiKey || fetchPlan.length === 0) {
    return;
  }

  const size = Math.min(maxSymbolsPerRefresh, fetchPlan.length);
  const chunk: string[] = [];
  for (let k = 0; k < size; k += 1) {
    chunk.push(fetchPlan[(cursor + k) % fetchPlan.length]);
  }
  cursor = (cursor + size) % fetchPlan.length;

  const quotes = await fetchQuotes(chunk);
  for (const [symbol, data] of quotes) {
    liveQuotes.set(symbol, data);
  }
}

// Overlay whatever live quotes we have on the baseline demo values.
function assemble(): MarketData {
  const indices: IndexQuote[] = indexDefs.map((def) => {
    const quote = def.td ? liveQuotes.get(def.td) : undefined;
    if (!quote) {
      return { symbol: def.symbol, name: def.name, value: def.value, change: def.change, changePercent: def.changePercent };
    }
    return { symbol: def.symbol, name: def.name, value: quote.price, change: quote.change, changePercent: quote.percentChange };
  });

  const stocks: StockQuote[] = stockDefs.map((def) => {
    const quote = liveQuotes.get(def.symbol);
    const changePercent = quote?.percentChange ?? def.changePercent;
    const spark = buildSpark(def.symbol, changePercent);
    if (!quote) {
      return { ...def, spark };
    }
    return {
      symbol: def.symbol,
      name: def.name,
      price: quote.price,
      change: quote.change,
      changePercent: quote.percentChange,
      volume: quote.volume > 0 ? formatVolume(quote.volume) : def.volume,
      spark
    };
  });

  const sectors: SectorPerformance[] = sectorDefs.map((def) => {
    const quote = liveQuotes.get(def.td);
    return { name: def.name, changePercent: quote?.percentChange ?? def.changePercent };
  });

  return { indices, stocks, sectors };
}

export async function getMarketData(): Promise<MarketData> {
  const now = Date.now();

  // Kick off a background chunk refresh when due (deduped via inFlight).
  if (apiKey && !inFlight && now - lastRefresh >= refreshIntervalMs) {
    inFlight = refreshChunk()
      .catch((error: unknown) => console.error('Market chunk refresh failed:', error))
      .finally(() => {
        lastRefresh = Date.now();
        inFlight = null;
      });
  }

  // On a cold start, wait for the first chunk so the page shows some real data
  // immediately; afterwards return right away and let refreshes run in the
  // background.
  if (inFlight && liveQuotes.size === 0) {
    await inFlight;
  }

  return assemble();
}
