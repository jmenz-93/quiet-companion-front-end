import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdvisorDashboard, requestRecommendation } from '../lib/api';
import type { Client, Recommendation } from '../types';
import { TerminalHeader } from '../components/TerminalHeader';
import { useAuth } from '../context/AuthContext';

const riskTone: Record<string, string> = {
  Conservative: 'bg-sky-50 text-sky-700',
  Moderate: 'bg-amber-50 text-amber-700',
  Growth: 'bg-emerald-50 text-emerald-700'
};

export function AdvisorPage() {
  const { advisor } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [transcript, setTranscript] = useState(
    'Client noted they want to rebalance from idle cash toward quality income while staying within moderate risk.'
  );
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdvisorDashboard()
      .then((data) => {
        setClients(data.clients);
        setSelectedClientId(data.clients[0]?.id ?? '');
      })
      .catch(() => navigate('/', { replace: true }));
  }, [navigate]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId]
  );

  const handleRecommendations = async () => {
    if (!selectedClient || !selectedClient.accounts[0]) {
      return;
    }
    setLoading(true);
    try {
      const result = await requestRecommendation({
        clientId: selectedClient.id,
        accountId: selectedClient.accounts[0].id,
        transcript
      });
      setRecommendations(result.recommendations);
      setSummary(result.summary);
    } finally {
      setLoading(false);
    }
  };

  if (!advisor) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <TerminalHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Your book of relationships and their focus for the quarter.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Client list */}
          <aside className="card h-max overflow-hidden">
            <div className="card-head">
              <h2 className="card-title">Your clients</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {clients.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {clients.map((client) => {
                const active = client.id === selectedClient?.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`focusable flex w-full items-center gap-3 px-5 py-3.5 text-left transition ${
                      active ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                        active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {client.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-medium ${active ? 'text-brand-700' : 'text-slate-800'}`}>
                        {client.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{client.household}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-6">
            {/* Client overview */}
            <div className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">{selectedClient?.name}</h2>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{selectedClient?.focus}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                  {selectedClient?.household}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {selectedClient?.accounts.map((account) => (
                  <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">{account.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${riskTone[account.risk] ?? 'bg-slate-100 text-slate-600'}`}>
                        {account.risk}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{account.strategy}</div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Value</span>
                        <span className="nums font-medium text-slate-800">{account.marketValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cash</span>
                        <span className="nums font-medium text-slate-800">{account.cash}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation → recommendations */}
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="card card-pad">
                <h3 className="text-sm font-semibold text-slate-800">Conversation notes</h3>
                <p className="mt-1 text-sm text-slate-500">Paste what you heard, and we'll suggest clear next steps.</p>
                <textarea
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  className="focusable mt-4 min-h-40 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-500"
                />
                <button
                  onClick={handleRecommendations}
                  disabled={loading}
                  className="focusable mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Reviewing…' : 'Suggest next steps'}
                </button>
              </div>

              <div className="card card-pad">
                <h3 className="text-sm font-semibold text-slate-800">Suggested next steps</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {summary || 'Add conversation notes and we will surface tailored ideas here.'}
                </p>
                <div className="mt-4 space-y-2.5">
                  {recommendations.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {item.confidence}% match
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
