import React, { useState } from 'react';
import { Trash2, ExternalLink, ChevronDown } from 'lucide-react';
import { AGENT_MAP, type AgentId } from '@/data/agents';
import { PIPELINE_STAGES, type PipelineStatus, type SavedOpportunity } from '@/lib/pipeline';
import { usePipeline } from '@/contexts/PipelineContext';

const PipelineCard: React.FC<{ item: SavedOpportunity }> = ({ item }) => {
  const { setStatus, remove } = usePipeline();
  const [open, setOpen] = useState(false);
  const agent = AGENT_MAP[item.agent_id as AgentId];
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const playbook = Array.isArray(item.playbook) ? item.playbook : [];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${agent ? agent.accent : 'text-slate-400'}`}>
          {agent ? agent.codename : item.agent_id}
        </span>
        <button
          type="button"
          onClick={() => remove(item.id)}
          aria-label="Delete saved opportunity"
          className="rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <h4 className="mt-1.5 text-sm font-semibold leading-snug text-slate-800">{item.title}</h4>
      {item.summary && <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-500">{item.summary}</p>}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Value</div>
          <div className="text-[11px] font-medium text-slate-700">{item.payout || '—'}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Score / Diff</div>
          <div className="text-[11px] font-medium text-slate-700">
            {item.score ?? 0} · {item.difficulty ?? '—'}/10
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={item.status}
          onChange={(e) => setStatus(item.id, e.target.value as PipelineStatus)}
          aria-label="Change status"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-indigo-300"
        >
          {PIPELINE_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {playbook.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50"
            aria-label="Toggle playbook"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {open && (
        <ol className="mt-3 space-y-1.5 border-l-2 border-slate-100 pl-3">
          {playbook.map((step, i) => (
            <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-500">
              <span className="font-mono text-slate-400">{String(i + 1).padStart(2, '0')}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {item.source_url && item.source_url !== '#' && (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-indigo-600"
        >
          Source <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export default PipelineCard;
