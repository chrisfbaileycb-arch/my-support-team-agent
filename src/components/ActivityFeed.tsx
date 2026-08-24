import React from 'react';
import { Activity } from 'lucide-react';
import { ACTIVITY_LOG, AGENTS } from '@/data/agents';
import { SCHEDULE_MAP } from '@/data/covenant';
import { useSchedules } from '@/contexts/ScheduleContext';

const ActivityFeed: React.FC = () => {
  const { schedules } = useSchedules();

  return (
    <section id="feed" className="py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-500">
          <Activity className="h-3.5 w-3.5" /> Live feed
        </div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
          Your team, working quietly in the background
        </h2>
        <p className="mt-3 max-w-2xl text-slate-500">
          Everything the agents did on their most recent cycles, and the rhythm each one is keeping right now.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-white bg-white/80 p-2 shadow-sm sm:p-3">
            <ul className="divide-y divide-slate-100">
              {ACTIVITY_LOG.map((row, i) => (
                <li key={i} className="flex items-start gap-3 px-3 py-3.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${row.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${row.tone}`}>
                        {row.agent}
                      </span>
                      <span className="text-[11px] text-slate-400">{row.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{row.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Current rhythm</h3>
            <ul className="mt-4 space-y-3">
              {AGENTS.map((a) => {
                const preset = SCHEDULE_MAP[schedules[a.id] || 'daily'];
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${a.glow}`} />
                      <span className="truncate text-sm text-slate-600">{a.name}</span>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${preset.dot}`} />
                      {preset.chip}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivityFeed;
