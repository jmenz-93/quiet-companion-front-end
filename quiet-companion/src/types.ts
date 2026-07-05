export type MarketArticle = {
  id: string;
  headline: string;
  source: string;
  summary: string;
  timestamp: string;
  tickers: string[];
};

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  spark: number[];
};

export type IndexQuote = {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
};

export type SectorPerformance = {
  name: string;
  changePercent: number;
};

export type Account = {
  id: string;
  label: string;
  strategy: string;
  marketValue: string;
  cash: string;
  risk: 'Conservative' | 'Moderate' | 'Growth';
};

export type Client = {
  id: string;
  name: string;
  household: string;
  focus: string;
  accounts: Account[];
};

export type Advisor = {
  id: string;
  name: string;
  desk: string;
  region: string;
  email: string;
};

export type Recommendation = {
  title: string;
  detail: string;
  confidence: number;
};
