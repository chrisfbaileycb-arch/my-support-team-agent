import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Route as RouteIcon, Loader2, Download, Mail, Copy, Check, AlertTriangle,
  CheckCircle2, Circle, ArrowLeft, Sparkles, Flag, Timer, ShieldAlert, Trash2, History,
  FileText, CheckSquare, Calendar, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useAuth } from '@/contexts/AuthContext';
import { AGENT_MAP } from '@/data/agents';
import {
  generateReport, fetchReports, saveCompletedSteps, deleteReport,
  reportToMarkdown, downloadMarkdown, mailtoLink, type FinalReport as Report,
} from '@/lib/reports';

const AXIS = AGENT_MAP['chief-of-staff'];

const FinalReportPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [goal, setGoal] = useState('first reliable income line');
  const [hours, setHours] = useState('10-15');
  const [budget, setBudget] = useState('$0 — free tiers only');
  const [level, setLevel] = useState('intermediate');
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<{ usedRuns: number; savedCount: number } | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await fetchReports(user.id);
      setHistory(rows);
      if (!report && rows.length) setReport(rows[0]);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [user, report]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const run = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const res = await generateReport(user.id, { goal, hours, budget, level });
      setReport(res.report);
      setMeta({ usedRuns: res.usedRuns, savedCount: res.savedCount });
      const rows = await fetchReports(user.id);
      setHistory(rows);
    } catch (e) {
      setError((e as Error).message || 'AXIS-07 could not complete the synthesis. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleStep = async (n: number) => {
    if (!report) return;
    const done = report.completed_steps || [];
    const next = done.includes(n) ? done.filter((x) => x !== n) : [...done, n];
    setReport({ ...report, completed_steps: next });
    if (report.id) {
      try { await saveCompletedSteps(report.id, next); } catch { /* keep the optimistic state */ }
    }
  };

  const copy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(reportToMarkdown(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };

  const removeReport = async (id: string) => {
    await deleteReport(id).catch(() => undefined);
    const rows = history.filter((r) => r.id !== id);
    setHistory(rows);
    if (report?.id === id) setReport(rows[0] ?? null);
  };

  const steps = report?.steps || [];
  const doneCount = (report?.completed_steps || []).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const input = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-rose-300';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7FA] via-[#F7FBFF] to-[#F6FFFB] text-slate-700 antialiased">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-rose-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to the platform
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">
              <RouteIcon className="h-4 w-4" /> {AXIS.codename} · final report
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">One path worth walking</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              AXIS-07 reads the latest stored findings from all six upstream agents plus everything in your saved
              pipeline, then returns a single ordered path — numbered steps, time estimates, checkpoints and
              kill-criteria. No menu of options.
            </p>
          </div>
          <img src={AXIS.image} alt="" className="hidden h-20 w-20 rounded-2xl object-cover ring-4 ring-white sm:block" />
        </div>

        {!user ? (
          <div className="mt-8 rounded-3xl border border-white bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <Sparkles className="mx-auto h-6 w-6 text-rose-400" />
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
              Sign in from the header to generate your final report. AXIS-07 needs your stored agent runs and your saved
              pipeline, and both live on your account.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-5">
              <div className="rounded-3xl border border-white bg-white/85 p-5 shadow-sm backdrop-blur">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Your constraints</h2>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-semibold text-slate-500">
                    Outcome you want
                    <input value={goal} onChange={(e) => setGoal(e.target.value)} className={`mt-1.5 ${input}`} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-500">
                    Hours per week
                    <input value={hours} onChange={(e) => setHours(e.target.value)} className={`mt-1.5 ${input}`} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-500">
                    Budget
                    <input value={budget} onChange={(e) => setBudget(e.target.value)} className={`mt-1.5 ${input}`} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-500">
                    Skill level
                    <select value={level} onChange={(e) => setLevel(e.target.value)} className={`mt-1.5 ${input}`}>
                      <option value="rookie">Rookie</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={run}
                  disabled={busy}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-400 to-indigo-400 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-rose-500 hover:to-indigo-500 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RouteIcon className="h-4 w-4" />}
                  {busy ? 'Synthesising…' : 'Generate my final path'}
                </button>
                {meta && (
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Built from {meta.usedRuns} agent run{meta.usedRuns === 1 ? '' : 's'} · {meta.savedCount} pipeline items
                  </p>
                )}
                {error && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{error}</span>
                  </div>
                )}
              </div>

              {history.length > 0 && (
                <div className="rounded-3xl border border-white bg-white/85 p-5 shadow-sm backdrop-blur">
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <History className="h-3.5 w-3.5" /> Saved reports
                  </h2>
                  <div className="mt-3 space-y-2">
                    {history.map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-start gap-2 rounded-xl border p-2.5 transition ${
                          report?.id === r.id ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-white'
                        }`}
                      >
                        <button type="button" onClick={() => setReport(r)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-xs font-semibold text-slate-700">{r.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(r.created_at).toLocaleDateString()} · {(r.steps || []).length} steps ·{' '}
                            {(r.completed_steps || []).length} done
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => r.id && removeReport(r.id)}
                          aria-label="Delete report"
                          className="rounded-lg p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {!report && !busy && (
                <div className="rounded-3xl border border-white bg-white/70 p-10 text-center shadow-sm backdrop-blur">
                  <p className="text-sm text-slate-500">
                    No report yet. Set your constraints and let AXIS-07 read everything your team has produced.
                  </p>
                </div>
              )}

              {busy && (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl border border-white bg-white/70" />
                  ))}
                </div>
              )}

              {report && !busy && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-[0_24px_70px_-46px_rgba(244,63,94,0.7)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800">{report.title}</h2>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            fetch('/api/workspace/export', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ targetApp: 'Google Docs', title: report.title, content: reportToMarkdown(report) }),
                            }).catch(() => undefined);
                            toast.success('Report formatted and exported to Google Docs');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" /> Google Docs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            fetch('/api/workspace/export', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ targetApp: 'Google Tasks', title: report.title, steps: report.steps }),
                            }).catch(() => undefined);
                            toast.success(`${(report.steps || []).length} steps synced to Google Tasks`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-600" /> Google Tasks
                        </button>
                        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button type="button" onClick={() => downloadMarkdown(report)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                          <Download className="h-3.5 w-3.5" /> Markdown
                        </button>
                        <a
                          href={mailtoLink(report, profile?.email || user.email || '')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                        >
                          <Mail className="h-3.5 w-3.5" /> Gmail dispatch
                        </a>
                      </div>
                    </div>

                    {report.summary && <p className="mt-4 text-sm leading-relaxed text-slate-600">{report.summary}</p>}

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>{doneCount} of {steps.length} steps complete</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  {(report.agent_summaries || []).length > 0 && (
                    <div className="rounded-3xl border border-white bg-white/85 p-5 shadow-sm backdrop-blur">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">What each agent found</h3>
                      <ul className="mt-3 space-y-2">
                        {report.agent_summaries.map((a, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-600">
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-500">{a.codename}</span>
                            <span className="flex-1">{a.line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(report.conflicts || []).length > 0 && (
                    <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Conflicts resolved</h3>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {report.conflicts.map((c, i) => (
                          <li key={i}>
                            <span className="font-semibold">{c.between}</span> → {c.decision}
                            <span className="block text-xs text-slate-500">{c.why}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-3">
                    {steps.map((s) => {
                      const done = (report.completed_steps || []).includes(s.n);
                      return (
                        <div
                          key={s.n}
                          className={`rounded-2xl border p-4 transition ${done ? 'border-emerald-200 bg-emerald-50/70' : 'border-white bg-white shadow-sm'}`}
                        >
                          <div className="flex items-start gap-3">
                            <button type="button" onClick={() => toggleStep(s.n)} aria-label="Toggle step complete" className="mt-0.5 shrink-0">
                              {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-300" />}

                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                                  STEP {String(s.n).padStart(2, '0')}
                                </span>
                                <h4 className={`text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{s.title}</h4>
                                {s.agent && <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-indigo-500">{s.agent}</span>}
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.action}</p>
                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                {s.time && (
                                  <span className="inline-flex items-start gap-1.5 rounded-xl bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-700">
                                    <Timer className="mt-0.5 h-3 w-3 shrink-0" /> {s.time}
                                  </span>
                                )}
                                {s.checkpoint && (
                                  <span className="inline-flex items-start gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-700">
                                    <Flag className="mt-0.5 h-3 w-3 shrink-0" /> {s.checkpoint}
                                  </span>
                                )}
                                {s.killCriteria && (
                                  <span className="inline-flex items-start gap-1.5 rounded-xl bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700">
                                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" /> {s.killCriteria}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(report.schedule_advice || []).length > 0 && (
                    <div className="rounded-3xl border border-white bg-white/85 p-5 shadow-sm backdrop-blur">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recommended cadence</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {report.schedule_advice.map((s, i) => (
                          <span key={i} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600">
                            <span className="font-mono uppercase tracking-[0.14em] text-indigo-500">{s.codename}</span> · {s.cadence}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.next_24h && (
                    <div className="rounded-3xl bg-gradient-to-r from-rose-100 via-indigo-100 to-emerald-100 p-[1px]">
                      <div className="rounded-3xl bg-white p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">The next 24 hours</h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">{report.next_24h}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter onNavigate={() => undefined} />
    </div>
  );
};

export default FinalReportPage;
