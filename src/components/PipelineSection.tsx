import React from 'react';
import { Workflow, Heart } from 'lucide-react';
import { PIPELINE_STEPS, PRINCIPLES } from '@/data/agents';
import { COVENANT, COVENANT_STATEMENT } from '@/data/covenant';

const PipelineSection: React.FC = () => (
  <section id="pipeline" className="py-16">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">
        <Workflow className="h-3.5 w-3.5" /> How it works
      </div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
        Ingest, rank, benchmark, compound, direct
      </h2>
      <p className="mt-3 max-w-2xl text-slate-500">
        The chain runs on the rhythm you set at the top of this page. Each stage hands clean work to the next, and the
        last agent turns all of it into one path you can actually walk.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {PIPELINE_STEPS.map((s) => (
          <div
            key={s.step}
            className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="text-2xl font-extrabold text-transparent [-webkit-text-stroke:1px_rgb(165,180,252)]">
              {s.step}
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-800">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="rounded-3xl bg-gradient-to-br from-indigo-50 to-emerald-50 p-5">
            <h3 className="text-sm font-bold text-slate-800">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-white bg-gradient-to-r from-rose-50 via-white to-sky-50 p-6 shadow-sm sm:p-9">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">
          <Heart className="h-4 w-4" /> The covenant we all keep
        </div>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700">{COVENANT_STATEMENT}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {COVENANT.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white bg-white/80 p-4">
              <h4 className="text-sm font-bold text-slate-800">{c.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default PipelineSection;
