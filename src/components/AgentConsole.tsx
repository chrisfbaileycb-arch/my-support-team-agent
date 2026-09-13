import React, { useState } from 'react';
import { Play, Loader2, Copy, Check, TerminalSquare, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Agent, Opportunity, ProvenanceState, RetrievedEvidenceItem } from '@/data/agents';
import OpportunityCard from '@/components/OpportunityCard';

interface Props {
  agent: Agent;
}

interface RunResult {
  headline?: string;
  warning?: string;
  findings?: Partial<Opportunity>[];
  error?: string;
  rawText?: string;
}

const AgentConsole: React.FC<Props> = ({ agent }) => {
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const runCycle = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('run-agent', {
        body: { agentName: agent.codename, systemPrompt: agent.systemPrompt, focus },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setResult(data as RunResult);
    } catch (e) {
      setError((e as Error).message || 'Agent cycle failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(agent.systemPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const normalised: Opportunity[] = (result?.findings || []).map((f, i) => ({
    id: (f as { id?: string }).id || `live-${i}`,
    rank: Number(f.rank) || i + 1,
    title: f.title || 'Untitled finding',
    source: f.source || agent.codename,
    sourceUrl: (f as { sourceUrl?: string; source_url?: string }).sourceUrl || (f as { source_url?: string }).source_url || '#',
    summary: f.summary || '',
    difficulty: Math.min(10, Math.max(1, Number(f.difficulty) || 5)),
    score: Math.min(100, Math.max(0, Number(f.score) || 70)),
    payout: f.payout || '—',
    timeToValue: f.timeToValue || (f as { time_to_value?: string }).time_to_value || '—',
    tags: Array.isArray(f.tags) ? f.tags.slice(0, 4) : [],
    playbook: Array.isArray(f.playbook) ? f.playbook : [],
    provenance: (f as { provenance?: ProvenanceState }).provenance,
    is_verified: (f as { is_verified?: boolean }).is_verified,
    is_direct_queried: (f as { is_direct_queried?: boolean }).is_direct_queried,
    excerpt: (f as { excerpt?: string }).excerpt,
    evidence_ids: (f as { evidence_ids?: string[] }).evidence_ids,
    inference_notes: (f as { inference_notes?: string }).inference_notes,
    evidence: (f as { evidence?: RetrievedEvidenceItem[] }).evidence,
  }));

  return (
    <div className={`rounded-3xl border ${agent.ring} ${agent.soft} p-5 sm:p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalSquare className={`h-4 w-4 ${agent.accent}`} />
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Live cycle · {agent.codename}
          </h4>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-indigo-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Google Gemini 3.7 Flash
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Give the agent a niche, market or product to focus on, then ask it kindly to run a cycle. It reports and ranks
        — it never takes action on your behalf.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading) runCycle(); }}
          placeholder="e.g. home fitness creators, or bookkeeping for small clinics"
          className="flex-1 rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300"
        />
        <button
          type="button"
          onClick={runCycle}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
          style={{ backgroundColor: agent.accentHex }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {loading ? 'Running cycle…' : 'Run cycle'}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white bg-white/70" />
          ))}
          <p className="text-xs text-slate-400">sweeping {agent.scanTargets.slice(0, 4).join(' · ')} …</p>
        </div>
      )}

      {result && !loading && (
        <div className="mt-5 space-y-4">
          {result.headline && (
            <p className="rounded-2xl border border-white bg-white p-3 text-sm text-slate-700 shadow-sm">
              {result.headline}
            </p>
          )}
          {result.rawText && normalised.length === 0 && (
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-white bg-white p-4 text-xs text-slate-600 shadow-sm">
              {result.rawText}
            </pre>
          )}
          {normalised.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              agentId={agent.id}
              accent={agent.accent}
              accentHex={agent.accentHex}
              glow={agent.glow}
            />
          ))}
          {result.warning && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{result.warning}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-white bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">skill.md</span>
          <button
            type="button"
            onClick={copyPrompt}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy prompt'}
          </button>
        </div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-slate-500">
          {agent.systemPrompt}
        </pre>
      </div>
    </div>
  );
};

export default AgentConsole;
