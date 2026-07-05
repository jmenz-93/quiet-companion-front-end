import { NavLink, useNavigate } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { Clock } from './Clock';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../lib/api';

const navItems = [
  { to: '/market', label: 'Markets' },
  { to: '/advisor', label: 'Clients' }
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TerminalHeader() {
  const { advisor, refresh } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    await refresh();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-7">
          <BrandMark />
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `focusable rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <Clock />
          </div>
          {advisor ? (
            <div className="flex items-center gap-2.5 pl-1">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-sm font-medium text-slate-800">{advisor.name}</div>
                <div className="text-xs text-slate-500">{advisor.desk}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                {initials(advisor.name)}
              </div>
              <button
                onClick={handleLogout}
                className="focusable rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
