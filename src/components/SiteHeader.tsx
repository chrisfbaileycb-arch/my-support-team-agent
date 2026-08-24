import React, { useState } from 'react';
import { Menu, X, Sun } from 'lucide-react';
import { BRAND } from '@/data/covenant';

const LINKS = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'agents', label: 'Agent Deck' },
  { id: 'pipeline-board', label: 'My Pipeline' },
  { id: 'pipeline', label: 'How It Works' },
  { id: 'feed', label: 'Live Feed' },
  { id: 'briefing', label: 'Daily Briefing' },
];

const SiteHeader: React.FC = () => {
  const [open, setOpen] = useState(false);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go('agents')}
            className="hidden rounded-xl bg-gradient-to-r from-indigo-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-emerald-500 sm:block"
          >
            Run an agent
          </button>
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
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
