import React from 'react';
import type { Agent } from '@/data/agents';

interface Props {
  agent: Agent;
  active: boolean;
  onSelect: (id: Agent['id']) => void;
}

const AgentCard: React.FC<Props> = ({ agent, active, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(agent.id)}
    className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
      active ? `${agent.ring} bg-white/[0.07]` : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]'
    }`}
  >
    <div
      className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
      style={{ backgroundColor: agent.accentHex }}
    />
    <div className="relative flex items-start gap-3">
      <img
        src={agent.image}
        alt={agent.name}
        loading="lazy"
        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${agent.accent}`}>{agent.codename}</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${agent.glow} opacity-75`} />
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${agent.glow}`} />
          </span>
        </div>
        <h3 className="mt-1 truncate text-sm font-semibold text-white">{agent.name}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">{agent.role}</p>
      </div>
    </div>
    <div className="relative mt-3 flex items-center justify-between border-t border-white/5 pt-3">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{agent.metricLabel}</span>
      <span className={`font-mono text-xs ${agent.accent}`}>{agent.metricValue}</span>
    </div>
  </button>
);

export default AgentCard;
