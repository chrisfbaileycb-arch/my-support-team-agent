import React from 'react';
import { CalendarClock, RotateCcw, Sparkles } from 'lucide-react';
import { AGENTS } from '@/data/agents';
import { SCHEDULE_PRESETS, SCHEDULE_MAP, type ScheduleId } from '@/data/covenant';
import { useSchedules } from '@/contexts/ScheduleContext';

const QUICK: ScheduleId[] = ['daily', 'weekdays', 'weekends', 'weekly-mon', 'ongoing', 'paused'];

const ScheduleBar: React.FC = () => {
  const { schedules, setSchedule, setAll, resetRecommended, activeCount } = useSchedules();

  return (
    <section id="schedule" className="relative py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-3xl border border-white bg-white/70 p-6 shadow-[0_20px_60px_-30px_rgba(99,102,241,0.45)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
                <CalendarClock className="h-4 w-4" /> Scheduling agent · TEMPO-00
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                Set the rhythm of your team
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Every agent keeps its own cadence — daily, Monday to Friday, weekends only, weekly on Monday, or
                ongoing. Rest is allowed. Your choices are saved to this browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {activeCount} of {AGENTS.length} awake
              </span>
              <button
                type="button"
                onClick={() => setAll('daily')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Sparkles className="h-3.5 w-3.5" /> All daily
              </button>
              <button
                type="button"
                onClick={resetRecommended}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Recommended
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {QUICK.map((id) => {
              const p = SCHEDULE_MAP[id];
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                  <span className="font-semibold text-slate-700">{p.chip}</span> · {p.detail}
                </span>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {AGENTS.map((a) => {
              const current = schedules[a.id] || 'daily';
              const preset = SCHEDULE_MAP[current];
              const resting = current === 'paused';
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-4 transition ${
                    resting ? 'border-slate-200 bg-slate-50/70' : `${a.ring} ${a.soft}`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={a.image} alt="" className="h-8 w-8 rounded-lg object-cover ring-1 ring-white" />
                    <div className="min-w-0">
                      <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${a.accent}`}>{a.codename}</div>
                      <div className="truncate text-xs font-semibold text-slate-700">{a.name}</div>
                    </div>
                  </div>

                  <label className="sr-only" htmlFor={`sched-${a.id}`}>
                    Schedule for {a.name}
                  </label>
                  <select
                    id={`sched-${a.id}`}
                    value={current}
                    onChange={(e) => setSchedule(a.id, e.target.value as ScheduleId)}
                    className="mt-3 w-full rounded-xl border border-white bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-300"
                  >
                    {SCHEDULE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${preset.dot}`} />
                    {preset.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScheduleBar;
