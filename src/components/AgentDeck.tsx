import React, { useState } from 'react';
import { Layers, Target, Boxes, FileOutput, Timer } from 'lucide-react';
import { AGENTS, AGENT_MAP, type AgentId } from '@/data/agents';
import AgentCard from '@/components/AgentCard';
import OpportunityCard from '@/components/OpportunityCard';
import AgentConsole from '@/components/AgentConsole';

const AgentDeck: React.FC = () => {
  const [activeId, setActiveId] = useState<AgentId>('freelance-scout');
  const agent = AGENT_MAP[activeId];

  return (
    <section id="agents" className="relative border-b border-white/10 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <Layers className="h-3.5 w-3.5" /> Agent deck
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Five specialists, one chained pipeline
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Select an agent to read its mission, source list, today&apos;s ranked Top 3, and the exact system prompt
              driving it. Then run a live cycle against your own niche.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Next full sweep</div>
            <div className="font-mono text-lg text-emerald-400">06:00 local</div>
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

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <img
                src={agent.image}
                alt={agent.name}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
              />
              <div>
                <div className={`font-mono text-[11px] uppercase tracking-[0.2em] ${agent.accent}`}>
                  Agent {String(agent.index).padStart(2, '0')} · {agent.codename}
                </div>
                <h3 className="mt-1.5 text-2xl font-bold text-white">{agent.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{agent.tagline}</p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-slate-300">{agent.mission}</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                  <Target className="h-3.5 w-3.5" /> Capabilities
                </div>
                <ul className="mt-3 space-y-2">
                  {agent.capabilities.map((c) => (
                    <li key={c} className="flex gap-2 text-sm text-slate-300">
                      <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${agent.glow}`} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                  <FileOutput className="h-3.5 w-3.5" /> Deliverables
                </div>
                <ul className="mt-3 space-y-2">
                  {agent.outputs.map((o) => (
                    <li key={o} className="flex gap-2 text-sm text-slate-300">
                      <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${agent.glow}`} />
                      {o}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                  <Timer className="h-3.5 w-3.5" /> Cadence
                </div>
                <div className="mt-1 font-mono text-sm text-slate-300">{agent.cadence}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                <Boxes className="h-3.5 w-3.5" /> Sources swept
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.scanTargets.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[11px] text-slate-400"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Today&apos;s Top 3</h4>
                <span className="font-mono text-[11px] text-slate-500">ranked · reporting only</span>
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
