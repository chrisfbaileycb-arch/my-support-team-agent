import React from 'react';
import { GitBranch, Lock } from 'lucide-react';
import { PIPELINE_STEPS, PRINCIPLES, PLATFORM_COVERAGE } from '@/data/agents';

const PipelineSection: React.FC = () => (
  <section id="pipeline" className="relative border-b border-white/10 py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
        <GitBranch className="h-3.5 w-3.5" /> Pipeline
      </div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Each agent feeds the next
      </h2>
      <p className="mt-3 max-w-2xl text-slate-400">
        The value is not five isolated bots. It is the chain: discovery feeds ranking, ranking feeds teardown,
        teardown feeds distribution.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PIPELINE_STEPS.map((s, i) => (
          <div
            key={s.step}
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
          >
            <div className="font-mono text-3xl font-bold text-white/15">{s.step}</div>
            <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-white/20 lg:block" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <Lock className="h-3.5 w-3.5" /> Operating principles
          </div>
          <div className="mt-5 space-y-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Connected surface area</div>
          <div className="mt-5 space-y-5">
            {Object.entries(PLATFORM_COVERAGE).map(([group, items]) => (
              <div key={group}>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">{group}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {items.map((p) => (
                    <span
                      key={p}
                      className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[11px] text-slate-400 transition hover:border-white/30 hover:text-white"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default PipelineSection;
