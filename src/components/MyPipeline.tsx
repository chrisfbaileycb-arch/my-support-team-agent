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
    <section id="pipeline-board" className="border-b border-white/10 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <KanbanSquare className="h-3.5 w-3.5" /> My pipeline
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you bookmarked, moving through stages
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Save any finding from any agent — seeded or live — and it lands here as New. Move it forward with the
              status dropdown as you research, execute, and either win it or kill it deliberately.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Saved</div>
              <div className="font-mono text-lg text-white">{saved.length}</div>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && saved.length === 0 ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your pipeline…
          </div>
        ) : saved.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <Bookmark className="mx-auto h-6 w-6 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">Nothing saved yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Hit <span className="text-white">Save</span> on any opportunity in the agent deck and it will appear here
              in the New column, ready to be worked.
            </p>
            <button
              type="button"
              onClick={scrollToAgents}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              Browse the agent deck
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {PIPELINE_STAGES.map((stage) => {
              const items = saved.filter((s) => s.status === stage.id);
              return (
                <div key={stage.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between px-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${stage.chip}`} />
                      <span className="text-sm font-semibold text-white">{stage.label}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-500">{items.length}</span>
                  </div>
                  <p className="px-1 pb-3 text-[11px] text-slate-600">{stage.hint}</p>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <PipelineCard key={item.id} item={item} />
                    ))}
                    {items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[11px] text-slate-600">
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
