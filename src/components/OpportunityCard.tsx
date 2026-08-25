import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Gauge, Clock, Wallet, Bookmark, BookmarkCheck, Loader2, FileText, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
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
    <div className="group rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:border-slate-200 hover:shadow-md">
      <div className="flex items-start gap-4 p-5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{ backgroundColor: `${accentHex}18`, color: accentHex }}
        >
          {opp.rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className="text-base font-semibold text-slate-800">{opp.title}</h4>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">{opp.source}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => bookmark(opp, agentId)}
              disabled={saved || busy}
              title={saved ? 'Already in My Pipeline' : 'Save to My Pipeline'}
              aria-label={saved ? 'Saved to pipeline' : 'Save to pipeline'}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                saved
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
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

          <p className="mt-2 text-sm leading-relaxed text-slate-600">{opp.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {opp.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
                <Wallet className="h-3 w-3" /> Value
              </div>
              <div className={`mt-0.5 text-sm font-semibold ${accent}`}>{opp.payout}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
                <Clock className="h-3 w-3" /> To value
              </div>
              <div className="mt-0.5 text-sm font-medium text-slate-700">{opp.timeToValue}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
                <Gauge className="h-3 w-3" /> Difficulty
              </div>
              <div className="mt-1.5 flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-sm"
                    style={{ backgroundColor: i < opp.difficulty ? accentHex : '#E2E8F0' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Signal score</div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${glow}`} style={{ width: `${opp.score}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{opp.score}/100</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {open ? 'Hide playbook' : 'View 5-step playbook'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <a
              href={opp.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-indigo-600"
            >
              Open source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {open && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Execution steps
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      fetch('/api/workspace/export', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetApp: 'Google Tasks', title: opp.title, steps: opp.playbook }),
                      }).catch(() => undefined);
                      toast.success(`Synced 5 tasks to Google Tasks`);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <CheckSquare className="h-3 w-3" /> Sync Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetch('/api/workspace/export', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetApp: 'Google Docs', title: opp.title, summary: opp.summary, playbook: opp.playbook }),
                      }).catch(() => undefined);
                      toast.success(`Exported playbook to Google Docs`);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <FileText className="h-3 w-3" /> Export Doc
                  </button>
                </div>
              </div>
              <ol className="space-y-2 border-l-2 border-slate-100 pl-4">
                {opp.playbook.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600">
                    <span className="font-mono text-xs font-semibold" style={{ color: accentHex }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
