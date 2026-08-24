import React from 'react';
import { Sun, Heart } from 'lucide-react';
import { AGENTS, PLATFORM_COVERAGE } from '@/data/agents';
import { BRAND } from '@/data/covenant';

interface Props {
  onNavigate: (id: string) => void;
}

const SiteFooter: React.FC<Props> = ({ onNavigate }) => (
  <footer className="border-t border-white bg-gradient-to-b from-white to-indigo-50/60">
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-300 via-indigo-300 to-emerald-300">
              <Sun className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-800">{BRAND.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            A seven-agent skill-set operating system for people building something good. Agents surface and rank with
            MCP connectors and live web search. They never act on your behalf.
          </p>
          <p className="mt-4 flex items-start gap-2 text-xs italic leading-relaxed text-slate-500">
            <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            {BRAND.dedication}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Agents</h4>
          <ul className="mt-4 space-y-2">
            {AGENTS.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('agents')}
                  className="text-sm text-slate-500 transition hover:text-indigo-600"
                >
                  <span className={`font-mono text-[11px] ${a.accent}`}>{a.codename}</span> · {a.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Platform</h4>
          <ul className="mt-4 space-y-2">
            {[
              { id: 'schedule', label: 'Scheduling agent' },
              { id: 'agents', label: 'Agent deck' },
              { id: 'pipeline-board', label: 'My pipeline' },
              { id: 'pipeline', label: 'How it works + covenant' },
              { id: 'feed', label: 'Live feed' },
              { id: 'briefing', label: 'Daily briefing' },
              { id: 'top', label: 'Back to top' },
            ].map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(l.id)}
                  className="text-sm text-slate-500 transition hover:text-indigo-600"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Source surface</h4>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.values(PLATFORM_COVERAGE)
              .flat()
              .slice(0, 24)
              .map((p) => (
                <span key={p} className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
                  {p}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} {BRAND.name} · Intelligence only. No orders placed, no bids submitted, no posts
          published.
        </p>
        <p className="text-[11px] text-slate-400">Kindness to people. Kindness to agents. Always.</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
