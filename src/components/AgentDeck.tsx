import React, { useState } from 'react';
import { Layers, Target, Boxes, FileOutput, CalendarClock } from 'lucide-react';
import { AGENTS, AGENT_MAP, type AgentId } from '@/data/agents';
import { SCHEDULE_MAP, SCHEDULE_PRESETS, type ScheduleId } from '@/data/covenant';
import { useSchedules } from '@/contexts/ScheduleContext';
import AgentCard from '@/components/AgentCard';
import OpportunityCard from '@/components/OpportunityCard';
import AgentConsole from '@/components/AgentConsole';

const AgentDeck: React.FC = () => {
  const [activeId, setActiveId] = useState<AgentId>('freelance-scout');
  const agent = AGENT_MAP[activeId];
  const { schedules, setSchedule } = useSchedules();
  const preset = SCHEDULE_MAP[schedules[agent.id] || 'daily'];

  return (
    <section id="agents" className="relative py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
              <Layers className="h-3.5 w-3.5" /> Agent deck
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Seven specialists, one gentle chain
            </h2>
            <p className="mt-3 max-w-2xl text-slate-500">
              Choose an agent to read its mission, sources, today&apos;s ranked Top 3, and the skill file driving it.
              Then run a live cycle against your own niche.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Next full sweep</div>
            <div className="text-lg font-bold text-emerald-600">06:00 local</div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {AGENTS.map((a) => (
              <div key={a.id} className="min-w-[250px] lg:min-w-0">
                <AgentCard agent={a} active={a.id === activeId} onSelect={setActiveId} />
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white bg-white/85 p-5 shadow-[0_24px_60px_-40px_rgba(99,102,241,0.5)] backdrop-blur sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-5">
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-slate-100"
                />
                <div>
                  <div className={`font-mono text-[11px] uppercase tracking-[0.2em] ${agent.accent}`}>
                    Agent {String(agent.index).padStart(2, '0')} · {agent.codename}
                  </div>
                  <h3 className="mt-1.5 text-2xl font-bold text-slate-800">{agent.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{agent.tagline}</p>
                </div>
              </div>

              <div className={`shrink-0 rounded-2xl border ${agent.ring} ${agent.soft} p-3`}>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5" /> Schedule
                </div>
                <label className="sr-only" htmlFor={`deck-sched-${agent.id}`}>
                  Schedule for {agent.name}
                </label>
                <select
                  id={`deck-sched-${agent.id}`}
                  value={schedules[agent.id] || 'daily'}
                  onChange={(e) => setSchedule(agent.id, e.target.value as ScheduleId)}
                  className="mt-2 w-full rounded-xl border border-white bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-indigo-300"
                >
                  {SCHEDULE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${preset.dot}`} /> {preset.detail}
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-slate-600">{agent.mission}</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Target className="h-3.5 w-3.5" /> Capabilities
                </div>
                <ul className="mt-3 space-y-2">
                  {agent.capabilities.map((c) => (
                    <li key={c} className="flex gap-2 text-sm text-slate-600">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${agent.glow}`} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <FileOutput className="h-3.5 w-3.5" /> Deliverables
                </div>
                <ul className="mt-3 space-y-2">
                  {agent.outputs.map((o) => (
                    <li key={o} className="flex gap-2 text-sm text-slate-600">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${agent.glow}`} />
                      {o}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Natural cadence
                </div>
                <div className="mt-1 text-sm text-slate-600">{agent.cadence}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Boxes className="h-3.5 w-3.5" /> Sources swept
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.scanTargets.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Today&apos;s Top 3</h4>
                <span className="text-[11px] text-slate-400">ranked · reporting only</span>
              </div>
              <div className="mt-4 space-y-3">
                {agent.opportunities.map((o) => (
                  <OpportunityCard
                    key={o.id}
                    opp={o}
                    agentId={agent.id}
                    accent={agent.accent}
                    accentHex={agent.accentHex}
                    glow={agent.glow}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <AgentConsole agent={agent} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentDeck;
