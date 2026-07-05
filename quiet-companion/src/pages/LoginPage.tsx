import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/api';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../context/AuthContext';

const highlights = [
  'Real-time markets, curated for advisors',
  'Client accounts and risk at a glance',
  'Turn conversations into clear next steps'
];

export function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      await refresh();
      navigate('/market', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Welcome panel */}
      <div className="relative hidden overflow-hidden bg-brand-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(600px 300px at 15% 15%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(500px 400px at 85% 90%, rgba(255,255,255,0.14), transparent 60%)'
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-2.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 20c0-7 5.5-13 15-13-1 8-6.5 12-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">Quiet Companion</span>
        </div>

        <div className="relative max-w-md text-white">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            A calmer way to guide every client conversation.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-white/90">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[0.95rem]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-sm text-white/70">Trusted by advisory teams to stay close to what matters.</div>
      </div>

      {/* Sign-in form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to your advisor workspace.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="focusable w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500"
                placeholder="you@firm.com"
                type="email"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="focusable w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500"
                placeholder="Enter your password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-down/20 bg-red-50 px-3.5 py-2.5 text-sm text-down">{error}</div>
            ) : null}

            <button
              disabled={loading}
              className="focusable w-full rounded-xl bg-brand-500 px-4 py-3 text-[0.95rem] font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span className="font-medium text-slate-600">Demo access:</span> alex.mercer@quietcompanion.io · demo1234
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">Protected by end-to-end encryption</p>
        </div>
      </div>
    </div>
  );
}
