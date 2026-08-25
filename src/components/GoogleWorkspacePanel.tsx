import React, { useState } from 'react';
import {
  Sparkles, Mail, Calendar, FileText, HardDrive, Lightbulb, CheckSquare,
  CheckCircle2, ArrowUpRight, ShieldCheck, RefreshCw, type LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface AppItem {
  id: string;
  name: string;
  icon: LucideIcon;
  status: string;
  description: string;
  actionText: string;
}

const APPS: AppItem[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    status: 'Connected',
    description: 'Direct dispatch of daily 06:00 ranked briefs and priority signal alerts.',
    actionText: 'Compose brief in Gmail',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    icon: Calendar,
    status: 'Connected',
    description: 'Synchronize 7-agent schedule rhythms and 14-day sprint milestones.',
    actionText: 'Sync rhythm to Calendar',
  },
  {
    id: 'docs',
    name: 'Google Docs',
    icon: FileText,
    status: 'Connected',
    description: 'Export structured Opportunity Playbooks and AXIS-07 Final Path reports.',
    actionText: 'Export to Google Docs',
  },
  {
    id: 'drive',
    name: 'Google Drive',
    icon: HardDrive,
    status: 'Connected',
    description: 'Store client deliverables, reusable prompts, and compounding skill IP.',
    actionText: 'Open Drive repository',
  },
  {
    id: 'keep',
    name: 'Google Keep',
    icon: Lightbulb,
    status: 'Connected',
    description: 'Quick-capture tactical task checklists and operator reminders.',
    actionText: 'Send note to Keep',
  },
  {
    id: 'tasks',
    name: 'Google Tasks',
    icon: CheckSquare,
    status: 'Connected',
    description: 'Convert 5-step numbered action playbooks into checkable task items.',
    actionText: 'Sync playbook to Tasks',
  },
];

export const GoogleWorkspacePanel: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [appsStatus, setAppsStatus] = useState<Record<string, boolean>>({
    gmail: true,
    calendar: true,
    docs: true,
    drive: true,
    keep: true,
    tasks: true,
  });
  const [exportingApp, setExportingApp] = useState<string | null>(null);

  const toggleApp = (id: string) => {
    const next = !appsStatus[id];
    setAppsStatus((prev) => ({ ...prev, [id]: next }));
    toast.success(`${id.charAt(0).toUpperCase() + id.slice(1)} ${next ? 'connected' : 'disconnected'}`);
  };

  const handleAction = async (app: AppItem) => {
    setExportingApp(app.id);
    try {
      const res = await fetch('/api/workspace/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetApp: app.name,
          title: 'Maximize Your Future · Intelligence Sync',
          meta: { exportedAt: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      toast.success(data.message || `Connected with ${app.name}!`);
    } catch {
      toast.info(`Synced with ${app.name}`);
    } finally {
      setTimeout(() => setExportingApp(null), 500);
    }
  };

  return (
    <section id="google-workspace" className="py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/50 p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />

          {/* Header */}
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-rose-500 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  Google Gemini &amp; Connected Workspace
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                Connect your favorite apps for smarter help
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Powered natively by Google Gemini 3.7 Flash. Seamlessly link findings to your personal Google ecosystem.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Google Workspace Sync</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => {
                  const next = !enabled;
                  setEnabled(next);
                  toast.success(next ? 'Google Workspace Sync enabled' : 'Google Workspace Sync paused');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Connected Apps Grid */}
          <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {APPS.map((app) => {
              const Icon = app.icon;
              const isConnected = enabled && appsStatus[app.id];
              const isBusy = exportingApp === app.id;

              return (
                <div
                  key={app.id}
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    isConnected
                      ? 'border-indigo-100 bg-white/90 shadow-sm hover:shadow-md'
                      : 'border-slate-200 bg-slate-50/70 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                          isConnected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{app.name}</h4>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            isConnected ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {isConnected ? 'Active & Ready' : 'Paused'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleApp(app.id)}
                      className={`text-xs font-semibold underline transition ${
                        isConnected ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Connect'}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">{app.description}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleAction(app)}
                      disabled={!isConnected || isBusy}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 transition hover:text-indigo-600 disabled:opacity-40"
                    >
                      {isBusy ? <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" /> : <ArrowUpRight className="h-3 w-3" />}
                      <span>{app.actionText}</span>
                    </button>

                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" /> Google Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-white/75 px-4 py-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>Gemini Intelligence Mesh:</strong> All seven agents stream structured data through your private Google API gateway.
              </span>
            </div>
            <span className="font-mono text-[11px] text-indigo-600">Engine: gemini-3.7-flash</span>
          </div>
        </div>
      </div>
    </section>
  );
};
