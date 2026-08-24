import React from 'react';
import type { Agent } from '@/data/agents';
import { SCHEDULE_MAP } from '@/data/covenant';
import { useSchedules } from '@/contexts/ScheduleContext';

interface Props {
  agent: Agent;
  active: boolean;
  onSelect: (id: Agent['id']) => void;
}

const AgentCard: React.FC<Props> = ({ agent, active, onSelect }) => {
  const { schedules } = useSchedules();
  const preset = SCHEDULE_MAP[schedules[agent.id] || 'daily'];

  return (
    <button
      type="button"
      onClick={() => onSelect(agent.id)}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
        active
          ? `${agent.ring} ${agent.soft} shadow-md`
          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <div className="relative flex items-start gap-3">
        <img
          src={agent.image}
          alt={agent.name}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${agent.accent}`}>{agent.codename}</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${agent.glow} opacity-70`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${agent.glow}`} />
            </span>
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-slate-800">{agent.name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-400">{agent.role}</p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${preset.dot}`} />
          {preset.chip}
        </span>
        <span className={`text-xs font-semibold ${agent.accent}`}>{agent.metricValue}</span>
      </div>
    </button>
  );
};

export default AgentCard;
