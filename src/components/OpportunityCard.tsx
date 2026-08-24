import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Gauge, Clock, Wallet, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import type { Opportunity, AgentId } from '@/data/agents';
import { usePipeline } from '@/contexts/PipelineContext';

interface Props {
  opp: Opportunity;
  agentId: AgentId | string;
  accent: string;
  accentHex: string;
  glow: string;
}

const OpportunityCard: React.FC<Props> = ({ opp, agentId, accent, accentHex, glow }) => {
  const [open, setOpen] = useState(false);
  const { bookmark, isSaved, savingId } = usePipeline();
  const saved = isSaved(opp.title);
  const busy = savingId === opp.id;

  return (
    <div className="group rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.06]">
      <div className="flex items-start gap-4 p-5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
          style={{ backgroundColor: `${accentHex}1f`, color: accentHex }}
        >
          {opp.rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className="text-base font-semibold text-white">{opp.title}</h4>
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{opp.source}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => bookmark(opp, agentId)}
              disabled={saved || busy}
              title={saved ? 'Already in My Pipeline' : 'Save to My Pipeline'}
              aria-label={saved ? 'Saved to pipeline' : 'Save to pipeline'}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                saved
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <BookmarkCheck className="h-3.5 w-3.5" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-400">{opp.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {opp.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[11px] font-medium text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                <Wallet className="h-3 w-3" /> Value
              </div>
              <div className={`mt-0.5 font-mono text-sm ${accent}`}>{opp.payout}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                <Clock className="h-3 w-3" /> To value
              </div>
              <div className="mt-0.5 font-mono text-sm text-slate-200">{opp.timeToValue}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                <Gauge className="h-3 w-3" /> Difficulty
              </div>
              <div className="mt-1.5 flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-sm"
                    style={{ backgroundColor: i < opp.difficulty ? accentHex : 'rgba(255,255,255,0.12)' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Signal score</div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${glow}`} style={{ width: `${opp.score}%` }} />
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">{opp.score}/100</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              {open ? 'Hide playbook' : 'View 5-step playbook'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <a
              href={opp.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
            >
              Open source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {open && (
            <ol className="mt-4 space-y-2 border-l border-white/10 pl-4">
              {opp.playbook.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="font-mono text-xs" style={{ color: accentHex }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
