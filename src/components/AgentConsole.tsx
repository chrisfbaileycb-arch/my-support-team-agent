import React, { useState } from 'react';
import { Play, Loader2, Copy, Check, TerminalSquare, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Agent, Opportunity } from '@/data/agents';
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
    id: `live-${i}`,
    rank: Number(f.rank) || i + 1,
    title: f.title || 'Untitled finding',
    source: f.source || agent.codename,
    sourceUrl: (f as { sourceUrl?: string }).sourceUrl || '#',
    summary: f.summary || '',
    difficulty: Math.min(10, Math.max(1, Number(f.difficulty) || 5)),
    score: Math.min(100, Math.max(0, Number(f.score) || 70)),
    payout: f.payout || '—',
    timeToValue: f.timeToValue || '—',
    tags: Array.isArray(f.tags) ? f.tags.slice(0, 4) : [],
    playbook: Array.isArray(f.playbook) ? f.playbook : [],
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <TerminalSquare className={`h-4 w-4 ${agent.accent}`} />
        <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Live cycle · {agent.codename}</h4>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Give the agent a niche, market or product to focus on, then run a live cycle. It reports and ranks — it never
        takes action on your behalf.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading) runCycle(); }}
          placeholder="e.g. home fitness creators, or B2B SaaS onboarding"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-white/30"
        />
        <button
          type="button"
          onClick={runCycle}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition disabled:opacity-60"
          style={{ backgroundColor: agent.accentHex }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {loading ? 'Running cycle…' : 'Run cycle'}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-white/5 bg-white/[0.04]" />
          ))}
          <p className="font-mono text-xs text-slate-500">
            sweeping {agent.scanTargets.slice(0, 4).join(' · ')} …
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="mt-5 space-y-4">
          {result.headline && (
            <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
              {result.headline}
            </p>
          )}
          {result.rawText && normalised.length === 0 && (
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/60 p-4 text-xs text-slate-300">
              {result.rawText}
            </pre>
          )}
          {normalised.map((o) => (
            <OpportunityCard key={o.id} opp={o} agentId={agent.id} accent={agent.accent} accentHex={agent.accentHex} glow={agent.glow} />

          ))}
          {result.warning && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{result.warning}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-white/10 bg-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">system_prompt.md</span>
          <button
            type="button"
            onClick={copyPrompt}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-white/10"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy prompt'}
          </button>
        </div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-slate-400">
          {agent.systemPrompt}
        </pre>
      </div>
    </div>
  );
};

export default AgentConsole;
