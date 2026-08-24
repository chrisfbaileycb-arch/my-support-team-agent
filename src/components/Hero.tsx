import React, { useEffect, useState } from 'react';
import { ArrowRight, Heart, CalendarClock } from 'lucide-react';
import { AGENTS, GLOBAL_STATS, HERO_IMAGE } from '@/data/agents';
import { BRAND } from '@/data/covenant';

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
    <div className="rounded-2xl border border-white bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
      <div className="text-xl font-bold text-slate-800 sm:text-2xl">
        {n.toLocaleString()}
        <span className="text-sm text-slate-400">{suffix}</span>
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
};

interface Props {
  onPrimary: () => void;
  onSecondary: () => void;
}

const Hero: React.FC<Props> = ({ onPrimary, onSecondary }) => (
  <section id="top" className="relative overflow-hidden">
    <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/85 to-[#FBFAFF]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(196,181,253,0.35),transparent_55%)]" />

    <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
      <div className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur">
        <Heart className="h-3.5 w-3.5 text-rose-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          7 agents · MCP + live search · kindness required
        </span>
      </div>

      <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-800 sm:text-6xl lg:text-7xl">
        {BRAND.name}
        <br />
        <span className="bg-gradient-to-r from-rose-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
          together with our agents.
        </span>
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
        A skill-set operating system for people who want to build something good. Seven specialists sweep freelance
        work, zero-ship commerce, weak signals, benchmarks, free growth channels, compounded agent skills — and one
        final path. They surface and rank. You decide, always.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrimary}
          className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-500 hover:via-sky-500 hover:to-emerald-500"
        >
          Meet the seven agents
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <CalendarClock className="h-4 w-4 text-indigo-500" />
          Set their schedule
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
            className={`flex items-center gap-2 rounded-xl border bg-white/80 px-3 py-2 shadow-sm backdrop-blur ${a.ring}`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${a.glow} opacity-70`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${a.glow}`} />
            </span>
            <span className={`text-[11px] font-semibold tracking-wide ${a.accent}`}>{a.codename}</span>
            <span className="hidden text-[11px] text-slate-400 sm:inline">working</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Hero;
