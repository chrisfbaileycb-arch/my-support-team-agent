import React, { useEffect, useState } from 'react';
import { ArrowRight, Radio, ShieldCheck } from 'lucide-react';
import { AGENTS, GLOBAL_STATS, HERO_IMAGE } from '@/data/agents';

const useCounter = (target: number, run: boolean) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const total = 45;
    const id = setInterval(() => {
      frame += 1;
      const p = Math.min(1, frame / total);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p === 1) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [target, run]);
  return n;
};

const Stat: React.FC<{ value: number; suffix: string; label: string }> = ({ value, suffix, label }) => {
  const n = useCounter(value, true);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur">
      <div className="font-mono text-xl font-bold text-white sm:text-2xl">
        {n.toLocaleString()}
        <span className="text-sm text-slate-400">{suffix}</span>
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
};

interface Props {
  onPrimary: () => void;
  onSecondary: () => void;
}

const Hero: React.FC<Props> = ({ onPrimary, onSecondary }) => (
  <section id="top" className="relative overflow-hidden border-b border-white/10">
    <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
    <div className="absolute inset-0 bg-gradient-to-b from-[#080B12]/70 via-[#080B12]/85 to-[#080B12]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_55%)]" />

    <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur">
        <Radio className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-300">
          5 agents · MCP + live web search · reporting only
        </span>
      </div>

      <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
        Five AI agents.
        <br />
        <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
          Zero guesswork.
        </span>
        <br />
        A ranked opportunity list, every day.
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
        A skill-set operating system for solo operators. Each agent owns one lane — freelance work, zero-ship
        commerce, weak-signal trends, competitive teardowns, and free-channel growth — sweeps its own sources, and
        hands you a Top 3 with an executable playbook. It surfaces. You decide.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrimary}
          className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200"
        >
          Open the agent deck
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
        >
          <ShieldCheck className="h-4 w-4" />
          How the pipeline works
        </button>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:max-w-3xl sm:grid-cols-4">
        {GLOBAL_STATS.map((s) => (
          <Stat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {AGENTS.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${a.glow} opacity-70`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${a.glow}`} />
            </span>
            <span className={`font-mono text-[11px] tracking-wider ${a.accent}`}>{a.codename}</span>
            <span className="hidden text-[11px] text-slate-500 sm:inline">scanning</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Hero;
