import type {
  Advisor,
  Client,
  IndexQuote,
  MarketArticle,
  Recommendation,
  SectorPerformance,
  StockQuote
} from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export type MarketSnapshot = {
  articles: MarketArticle[];
  stocks: StockQuote[];
  indices: IndexQuote[];
  sectors: SectorPerformance[];
};

export type AdvisorDashboard = {
  advisor: Advisor;
  clients: Client[];
};

export async function fetchMarketSnapshot() {
  return request<MarketSnapshot>('/api/market');
}

export async function signIn(email: string, password: string) {
  return request<{ advisor: Advisor }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function signOut() {
  await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function fetchSession() {
  return request<{ advisor: Advisor | null }>('/api/auth/me');
}

export async function fetchAdvisorDashboard() {
  return request<AdvisorDashboard>('/api/advisor/dashboard');
}

export async function requestRecommendation(payload: {
  clientId: string;
  accountId: string;
  transcript: string;
}) {
  return request<{ recommendations: Recommendation[]; summary: string }>('/api/recommendations/listen', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}