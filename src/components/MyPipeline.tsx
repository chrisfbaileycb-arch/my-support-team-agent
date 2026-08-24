import React from 'react';
import { KanbanSquare, Bookmark, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/pipeline';
import { usePipeline } from '@/contexts/PipelineContext';
import PipelineCard from '@/components/PipelineCard';

const MyPipeline: React.FC = () => {
  const { saved, loading, error, refresh } = usePipeline();

  const scrollToAgents = () => {
    document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="pipeline-board" className="py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              <KanbanSquare className="h-3.5 w-3.5" /> My pipeline
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Everything you bookmarked, moving forward
            </h2>
            <p className="mt-3 max-w-2xl text-slate-500">
              Save any finding from any agent — seeded or live — and it lands here as New. Move it along as you
              research, execute, and either win it or set it down kindly.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Saved</div>
              <div className="text-lg font-bold text-slate-800">{saved.length}</div>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && saved.length === 0 ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your pipeline…
          </div>
        ) : saved.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-indigo-200 bg-white/70 p-12 text-center">
            <Bookmark className="mx-auto h-6 w-6 text-indigo-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-800">Nothing saved yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Press <span className="font-semibold text-slate-700">Save</span> on any opportunity in the agent deck and
              it will appear here in the New column, ready to be worked.
            </p>
            <button
              type="button"
              onClick={scrollToAgents}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-500 hover:to-emerald-500"
            >
              Browse the agent deck
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {PIPELINE_STAGES.map((stage) => {
              const items = saved.filter((s) => s.status === stage.id);
              return (
                <div key={stage.id} className="rounded-3xl border border-white bg-white/70 p-3 shadow-sm">
                  <div className="flex items-center justify-between px-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${stage.chip}`} />
                      <span className="text-sm font-semibold text-slate-800">{stage.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">{items.length}</span>
                  </div>
                  <p className="px-1 pb-3 text-[11px] text-slate-400">{stage.hint}</p>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <PipelineCard key={item.id} item={item} />
                    ))}
                    {items.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-[11px] text-slate-400">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MyPipeline;
