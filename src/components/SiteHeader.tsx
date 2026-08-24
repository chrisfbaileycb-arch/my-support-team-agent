import React, { useState } from 'react';
import { Menu, X, Sun, LogOut, UserCircle2, Route } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BRAND } from '@/data/covenant';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

const LINKS = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'agents', label: 'Agent Deck' },
  { id: 'runs', label: 'Run History' },
  { id: 'pipeline-board', label: 'My Pipeline' },
  { id: 'feed', label: 'Live Feed' },
];

const SiteHeader: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const go = (id: string) => {
    setOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openAuth = (m: 'signin' | 'signup') => {
    setMode(m);
    setAuthOpen(true);
    setOpen(false);
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Member';

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <button type="button" onClick={() => go('top')} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-300 via-indigo-300 to-emerald-300">
            <Sun className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-800 sm:text-base">{BRAND.name}</span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              {l.label}
            </button>
          ))}
          <Link
            to="/final-report"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <Route className="h-3.5 w-3.5" /> Final Report
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <UserCircle2 className="h-3.5 w-3.5" /> {displayName}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="rounded-xl bg-gradient-to-r from-indigo-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-emerald-500"
              >
                Join us
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-3 lg:hidden">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              {l.label}
            </button>
          ))}
          <Link
            to="/final-report"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Final Report
          </Link>
          <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
            {user ? (
              <button
                type="button"
                onClick={() => { signOut(); setOpen(false); }}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
              >
                Sign out ({displayName})
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth('signin')}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-400 to-emerald-400 px-3 py-2 text-sm font-semibold text-white"
                >
                  Join us
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={mode} />
    </header>
  );
};

export default SiteHeader;
