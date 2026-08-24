import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { ACTIVITY_LOG } from '@/data/agents';

const ActivityFeed: React.FC = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3500);
    return () => clearInterval(id);
  }, []);

  const rotated = [...ACTIVITY_LOG.slice(tick % ACTIVITY_LOG.length), ...ACTIVITY_LOG.slice(0, tick % ACTIVITY_LOG.length)];

  return (
    <section id="feed" className="border-b border-white/10 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <Activity className="h-3.5 w-3.5" /> Unified feed
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything the swarm did today
            </h2>
            <p className="mt-3 text-slate-400">
              One chronological stream across all five agents so you can see exactly what was swept, what was
              discarded, and what got promoted to your Top 3. No black box.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="font-mono text-xl font-bold text-emerald-400">99.2%</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Signals discarded</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="font-mono text-xl font-bold text-blue-400">15</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Promoted to you</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="font-mono text-xl font-bold text-amber-400">0</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Actions taken for you</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">swarm.log</span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                live
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {rotated.map((e, i) => (
                <div
                  key={`${e.text}-${i}`}
                  className={`flex items-start gap-3 px-5 py-3 transition-colors ${i === 0 ? 'bg-white/[0.04]' : ''}`}
                >
                  <span className={`w-[92px] shrink-0 font-mono text-[11px] ${e.tone}`}>{e.agent}</span>
                  <span className="flex-1 text-sm text-slate-300">{e.text}</span>
                  <span className="shrink-0 font-mono text-[11px] text-slate-600">{e.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivityFeed;
