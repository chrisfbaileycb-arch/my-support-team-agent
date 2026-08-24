import React, { useState } from 'react';
import { Menu, X, Cpu } from 'lucide-react';

const LINKS = [
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080B12]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <button type="button" onClick={() => go('top')} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
            <Cpu className="h-4 w-4 text-black" />
          </span>
          <span className="font-mono text-sm font-bold tracking-[0.18em] text-white">OPUS-5</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              className="rounded-lg px-3.5 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go('agents')}
            className="hidden rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-200 sm:block"
          >
            Run an agent
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-lg border border-white/15 p-2 text-white md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-5 py-3 md:hidden">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
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
