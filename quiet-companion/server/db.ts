import { Pool } from 'pg';
import type { Advisor, Client, MarketArticle } from '../src/types';

type LoginAdvisor = Advisor & { password?: string };

const databaseUrl = process.env.DATABASE_URL;

export const hasDatabase = Boolean(databaseUrl);

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
    })
  : null;

type ClientAccountRow = {
  client_id: string;
  client_name: string;
  household: string | null;
  focus: string | null;
  account_id: string | null;
  account_label: string | null;
  strategy: string | null;
  market_value: string | null;
  cash: string | null;
  risk: 'Conservative' | 'Moderate' | 'Growth' | null;
};

const demoAdvisors: LoginAdvisor[] = [
  { id: 'adv-001', name: 'Alex Mercer', desk: 'Private Wealth', region: 'New York', email: 'alex.mercer@quietcompanion.io', password: 'demo1234' },
  { id: 'adv-002', name: 'Priya Shah', desk: 'Institutional Advisory', region: 'Chicago', email: 'priya.shah@quietcompanion.io', password: 'demo1234' }
];

const demoClientsByEmail: Record<string, Client[]> = {
  'alex.mercer@quietcompanion.io': [
    {
      id: 'cli-101',
      name: 'The Walker Household',
      household: 'Taxable + Trust',
      focus: 'Preserve capital, maintain income, and protect lifestyle spending.',
      accounts: [
        { id: 'acct-1', label: 'Taxable Account', strategy: 'Income tilt', marketValue: '$4.2M', cash: '$310K', risk: 'Moderate' },
        { id: 'acct-2', label: 'Revocable Trust', strategy: 'Core allocation', marketValue: '$6.8M', cash: '$540K', risk: 'Conservative' }
      ]
    },
    {
      id: 'cli-102',
      name: 'Rossi Family Office',
      household: 'Multi-entity',
      focus: 'Balance concentration risk while keeping optionality for opportunistic buys.',
      accounts: [{ id: 'acct-3', label: 'Managed Equity', strategy: 'Growth', marketValue: '$9.7M', cash: '$890K', risk: 'Growth' }]
    }
  ],
  'priya.shah@quietcompanion.io': [
    {
      id: 'cli-201',
      name: 'Harbor Endowment',
      household: 'Institutional',
      focus: 'Stabilize distributions and extend duration only where compensation is adequate.',
      accounts: [{ id: 'acct-4', label: 'Policy Sleeve', strategy: 'Barbell', marketValue: '$18.4M', cash: '$1.1M', risk: 'Moderate' }]
    }
  ]
};

export async function getAdvisorByEmail(email: string): Promise<LoginAdvisor | null> {
  if (!pool) {
    return demoAdvisors.find((advisor) => advisor.email === email) ?? null;
  }

  const result = await pool.query<LoginAdvisor>('select id, name, desk, region, email, password from advisors where email = $1 limit 1', [email]);
  return result.rows[0] ?? null;
}

export async function getAdvisorById(advisorId: string): Promise<Advisor | null> {
  if (!pool) {
    return demoAdvisors.find((advisor) => advisor.id === advisorId) ?? null;
  }

  const result = await pool.query<Advisor>('select id, name, desk, region, email from advisors where id = $1 limit 1', [advisorId]);
  return result.rows[0] ?? null;
}

export async function getClientsByAdvisorEmail(advisorEmail: string): Promise<Client[]> {
  if (!pool) {
    return demoClientsByEmail[advisorEmail] ?? [];
  }

  const result = await pool.query<ClientAccountRow>(
    `select
       c.id as client_id,
       c.name as client_name,
       c.household,
       c.focus,
       a.id as account_id,
       a.label as account_label,
       a.strategy,
       a.market_value,
       a.cash,
       a.risk
     from clients c
     left join accounts a on a.client_id = c.id
     where c.advisor_email = $1
     order by c.name, a.label`,
    [advisorEmail]
  );

  const clients = new Map<string, Client>();

  for (const row of result.rows) {
    if (!clients.has(row.client_id)) {
      clients.set(row.client_id, {
        id: row.client_id,
        name: row.client_name,
        household: row.household ?? 'Client',
        focus: row.focus ?? '',
        accounts: []
      });
    }

    if (row.account_id) {
      clients.get(row.client_id)?.accounts.push({
        id: row.account_id,
        label: row.account_label ?? 'Account',
        strategy: row.strategy ?? 'Core',
        marketValue: row.market_value ?? '$0',
        cash: row.cash ?? '$0',
        risk: row.risk ?? 'Moderate'
      });
    }
  }

  return Array.from(clients.values());
}

export async function getMarketArticles(): Promise<MarketArticle[]> {
  const finnhubToken = process.env.FINNHUB_API_KEY;
  const source = process.env.FINNHUB_NEWS_SOURCE ?? 'general';

  if (!finnhubToken) {
    return [
      {
        id: 'news-1',
        headline: 'Mega-cap earnings steady the tape as guidance narrows dispersion across growth names',
        source: 'Editorial fallback',
        summary: 'Live market headlines will appear here once news access is configured.',
        timestamp: '08:12 ET',
        tickers: ['AAPL', 'MSFT', 'NVDA']
      }
    ];
  }

  const response = await fetch(`https://finnhub.io/api/v1/news?category=${encodeURIComponent(source)}&token=${encodeURIComponent(finnhubToken)}`);
  if (!response.ok) {
    throw new Error(`Finnhub news request failed with status ${response.status}`);
  }

  const items = (await response.json()) as Array<{
    id?: number;
    headline?: string;
    source?: string;
    summary?: string;
    datetime?: number;
    related?: string;
  }>;

  // Finnhub's free tier has no dedicated "stock market" feed, so we pull the
  // broad business `general` category and keep only market-relevant stories:
  // anything tagged with stock tickers, or whose headline/summary matches
  // market vocabulary. This filters out the lifestyle/sports/politics noise.
  const marketNews = items.filter(isMarketNews);
  // If the filter is too aggressive for the current batch, fall back to the
  // unfiltered feed so the panel is never empty.
  const chosen = (marketNews.length >= 4 ? marketNews : items).slice(0, 9);

  return chosen.map((item, index) => ({
    id: String(item.id ?? `${index}`),
    headline: item.headline ?? 'Market update',
    source: item.source ?? 'Finnhub',
    summary: item.summary ?? '',
    timestamp: formatDateTime(item.datetime),
    tickers: item.related ? item.related.split(',').map((ticker) => ticker.trim()).filter(Boolean) : []
  }));
}

// Distinctive market/finance terms. Word boundaries keep out false positives
// like "grateful" (rate) or "supermarket" is tolerated as rare.
const MARKET_NEWS_REGEX =
  /\b(stocks?|shares|equit(?:y|ies)|nasdaq|dow jones|s&p|russell|earnings|revenue|profits?|dividends?|ipo|buybacks?|treasur(?:y|ies)|yields?|bonds?|federal reserve|the fed|interest rates?|rate (?:cut|hike)|inflation|wall street|markets?|investors?|analysts?|upgrade[ds]?|downgrade[ds]?|guidance|quarterly|futures|valuations?|mergers?|acquisitions?|hedge funds?|bull market|bear market|sell-?off|rally|nyse|s&p 500|shareholders?|traders?)\b/i;

function isMarketNews(item: { headline?: string; summary?: string; related?: string }): boolean {
  // Tagged with specific stock tickers → almost always market news.
  if (item.related && item.related.trim().length > 0) {
    return true;
  }
  const text = `${item.headline ?? ''} ${item.summary ?? ''}`;
  return MARKET_NEWS_REGEX.test(text);
}

function formatDateTime(timestamp?: number) {
  if (!timestamp) {
    return 'Live';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  }).format(new Date(timestamp * 1000));
}