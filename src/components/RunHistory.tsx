import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Loader2, RefreshCw, AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react';
import { AGENTS, AGENT_MAP } from '@/data/agents';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRuns, latestByAgent, triggerRun, toOpportunity, type AgentRun } from '@/lib/runs';
import OpportunityCard from '@/components/OpportunityCard';

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

const RunHistory: React.FC = () => {
  const { user } = useAuth();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(AGENTS[0].id);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      setRuns(await fetchRuns(user.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const latest = useMemo(() => latestByAgent(runs), [runs]);
  const agent = AGENT_MAP[selected as keyof typeof AGENT_MAP] ?? AGENTS[0];
  const latestForSelected = latest[selected];

  const runNow = async (agentId: string) => {
    if (!user) return;
    setRunningId(agentId);
    setError('');
    try {
      await triggerRun(user.id, agentId, '');
      await load();
      setSelected(agentId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <section id="runs" className="py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
              <History className="h-4 w-4" /> Run history
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              What your agents actually produced
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Every scheduled and manual cycle is stored against your account. These are real generated findings — not
              the seeded examples.
            </p>
          </div>
          {user && (
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          )}
        </div>

        {!user && (
          <div className="mt-6 rounded-3xl border border-white bg-white/70 p-8 text-center shadow-sm backdrop-blur">
            <p className="text-sm text-slate-600">
              Sign in from the header to store your run history, keep your schedules on every device, and let your
              agents run for you overnight.
            </p>
          </div>
        )}

        {user && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {AGENTS.map((a) => {
                const has = latest[a.id];
                const active = selected === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      active ? `${a.ring} ${a.soft} ${a.accent}` : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${has ? a.glow : 'bg-slate-300'}`} />
                    {a.codename}
                    {has && <span className="font-normal text-slate-400">· {timeAgo(has.created_at)}</span>}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
              <div className={`rounded-3xl border ${agent.ring} ${agent.soft} p-5 sm:p-6`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className={`font-mono text-[10px] uppercase tracking-[0.2em] ${agent.accent}`}>
                      {agent.codename} · latest stored cycle
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-800">{agent.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => runNow(agent.id)}
                    disabled={runningId === agent.id}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60"
                    style={{ backgroundColor: agent.accentHex }}
                  >
                    {runningId === agent.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <PlayCircle className="h-3.5 w-3.5" />
                    )}
                    {runningId === agent.id ? 'Running…' : 'Run now & save'}
                  </button>
                </div>

                {!latestForSelected && (
                  <p className="mt-5 rounded-2xl border border-white bg-white/80 p-4 text-sm text-slate-500">
                    No stored cycle yet for {agent.codename}. Run it now, or leave it scheduled — the daily job will
                    wake it on its cadence.
                  </p>
                )}

                {latestForSelected && (
                  <div className="mt-5 space-y-4">
                    {latestForSelected.headline && (
                      <p className="rounded-2xl border border-white bg-white p-3 text-sm text-slate-700 shadow-sm">
                        {latestForSelected.headline}
                      </p>
                    )}
                    {(latestForSelected.findings || []).slice(0, 3).map((f, i) => (
                      <OpportunityCard
                        key={`${latestForSelected.id}-${i}`}
                        opp={toOpportunity(f, i, agent.codename)}
                        agentId={agent.id}
                        accent={agent.accent}
                        accentHex={agent.accentHex}
                        glow={agent.glow}
                      />
                    ))}
                    {latestForSelected.warning && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{latestForSelected.warning}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white bg-white/70 p-5 shadow-sm backdrop-blur">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recent cycles</h4>
                <div className="mt-3 space-y-2">
                  {runs.length === 0 && (
                    <p className="text-sm text-slate-500">Nothing recorded yet. Your first run will appear here.</p>
                  )}
                  {runs.slice(0, 14).map((r) => {
                    const a = AGENT_MAP[r.agent_id as keyof typeof AGENT_MAP];
                    const ok = r.status === 'complete';
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelected(r.agent_id)}
                        className="flex w-full items-start gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5 text-left transition hover:border-indigo-200"
                      >
                        {ok ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${a?.accent || 'text-slate-500'}`}>
                            {r.codename || r.agent_id}
                          </span>
                          <span className="block truncate text-xs text-slate-600">
                            {ok ? r.headline || `${(r.findings || []).length} findings` : r.error || 'cycle failed'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {r.trigger} · {timeAgo(r.created_at)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default RunHistory;
