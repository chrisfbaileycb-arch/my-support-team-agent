import React, { useState } from 'react';
import { Menu, X, Sun, LogOut, UserCircle2, Route, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BRAND } from '@/data/covenant';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

interface SiteHeaderProps {
  onOpenBridge?: () => void;
}

const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenBridge }) => {
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
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/95 shadow-sm">
      {/* Left: Brand Logo */}
      <button
        type="button"
        onClick={() => go('top')}
        className="flex items-center gap-3 text-left focus:outline-none"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 via-indigo-400 to-emerald-400 shadow-sm">
          <Sun className="h-5 w-5 text-white" />
        </span>
        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          {BRAND.name}
        </span>
      </button>

      {/* Center / Nav Items */}
      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
        <button
          type="button"
          onClick={() => go('schedule')}
          className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Schedule
        </button>
        <button
          type="button"
          onClick={() => go('agents')}
          className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Agent Deck
        </button>
        <button
          type="button"
          onClick={() => go('runs')}
          className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Run History
        </button>
        <button
          type="button"
          onClick={() => go('pipeline-board')}
          className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          My Pipeline
        </button>
        <button
          type="button"
          onClick={() => go('feed')}
          className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Live Feed
        </button>
        {onOpenBridge && (
          <button
            type="button"
            onClick={onOpenBridge}
            className="flex items-center gap-1.5 font-semibold text-amber-600 transition hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <Zap className="h-3.5 w-3.5" /> Intermediary Bridge
          </button>
        )}
        <Link
          to="/final-report"
          className="flex items-center gap-1.5 font-semibold text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
        >
          <Route className="h-3.5 w-3.5" /> Final Report
        </Link>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              <UserCircle2 className="h-3.5 w-3.5" /> {displayName}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => openAuth('signin')}
              className="rounded-xl px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Join us
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden dark:border-slate-800 dark:text-slate-300"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-slate-200 bg-white px-6 py-4 shadow-xl lg:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col space-y-3">
            <button
              type="button"
              onClick={() => go('schedule')}
              className="text-left text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300"
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => go('agents')}
              className="text-left text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300"
            >
              Agent Deck
            </button>
            <button
              type="button"
              onClick={() => go('runs')}
              className="text-left text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300"
            >
              Run History
            </button>
            <button
              type="button"
              onClick={() => go('pipeline-board')}
              className="text-left text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300"
            >
              My Pipeline
            </button>
            <button
              type="button"
              onClick={() => go('feed')}
              className="text-left text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300"
            >
              Live Feed
            </button>
            {onOpenBridge && (
              <button
                type="button"
                onClick={() => { setOpen(false); onOpenBridge(); }}
                className="flex items-center gap-1 text-left text-sm font-semibold text-amber-600 dark:text-amber-400"
              >
                <Zap className="h-3.5 w-3.5" /> Intermediary Bridge
              </button>
            )}
            <Link
              to="/final-report"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-left text-sm font-semibold text-rose-600 dark:text-rose-400"
            >
              <Route className="h-3.5 w-3.5" /> Final Report
            </Link>
          </div>
          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {user ? (
              <button
                type="button"
                onClick={() => { signOut(); setOpen(false); }}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
              >
                Sign out ({displayName})
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth('signin')}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
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

