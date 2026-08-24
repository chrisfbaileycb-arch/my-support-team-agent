import React from 'react';
import { Cpu } from 'lucide-react';
import { AGENTS, PLATFORM_COVERAGE } from '@/data/agents';

interface Props {
  onNavigate: (id: string) => void;
}

const SiteFooter: React.FC<Props> = ({ onNavigate }) => (
  <footer className="border-t border-white/10 bg-black/40">
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
              <Cpu className="h-4 w-4 text-black" />
            </span>
            <span className="font-mono text-sm font-bold tracking-[0.18em] text-white">OPUS-5</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            A five-agent skill-set operating system for solo operators. Agents surface and rank opportunities with MCP
            connectors and live web search. They never act on your behalf.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Agents</h4>
          <ul className="mt-4 space-y-2">
            {AGENTS.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('agents')}
                  className="text-sm text-slate-500 transition hover:text-white"
                >
                  <span className={`font-mono text-[11px] ${a.accent}`}>{a.codename}</span> · {a.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Platform</h4>
          <ul className="mt-4 space-y-2">
            {[
              { id: 'agents', label: 'Agent Deck' },
              { id: 'pipeline-board', label: 'My Pipeline' },
              { id: 'pipeline', label: 'How the pipeline works' },

              { id: 'feed', label: 'Live swarm feed' },
              { id: 'briefing', label: 'Daily briefing' },
              { id: 'top', label: 'Back to top' },
            ].map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(l.id)}
                  className="text-sm text-slate-500 transition hover:text-white"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Source surface</h4>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.values(PLATFORM_COVERAGE)
              .flat()
              .slice(0, 20)
              .map((p) => (
                <span key={p} className="rounded border border-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                  {p}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] text-slate-600">
          © {new Date().getFullYear()} OPUS-5 · Intelligence only. No orders placed, no bids submitted, no posts published.
        </p>
        <p className="font-mono text-[11px] text-slate-600">Built for operators who move first.</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
