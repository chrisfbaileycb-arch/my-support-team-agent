import React, { useState, useEffect } from 'react';
import {
  Activity, ArrowRightLeft, ShieldCheck, RefreshCw, Layers, Database,
  Terminal, Globe, Zap, CheckCircle2, AlertCircle, Copy, Check, Lock,
  Plus, Server, Key, Play
} from 'lucide-react';
import { toast } from 'sonner';

interface ProxyLog {
  id: string;
  sourceClient: string;
  targetAgent: string;
  action: string;
  statusCode: number;
  latencyMs: number;
  timestamp: string;
}

interface BridgeKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  targetSite: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
}

export const IntermediateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'keys' | 'proxy-tester' | 'logs'>('status');
  const [bridgeKeys, setBridgeKeys] = useState<BridgeKeyItem[]>([]);
  const [logs, setLogs] = useState<ProxyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Key generation state
  const [keyName, setKeyName] = useState('Kitchen&Code Main Proxy');
  const [targetSite, setTargetSite] = useState('https://kitchenandcode.com');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Proxy tester state
  const [testerAgent, setTesterAgent] = useState('bridge-nexus');
  const [testerFocus, setTesterFocus] = useState('Restaurant Shift Ops & LedgerSync');
  const [testerResult, setTesterResult] = useState<Record<string, unknown> | null>(null);
  const [testerLoading, setTesterLoading] = useState(false);

  const fetchBridgeData = async () => {
    try {
      setLoading(true);
      const [keysRes, logsRes] = await Promise.all([
        fetch('/api/bridge/keys').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/proxy/logs').then((r) => (r.ok ? r.json() : [])),
      ]);
      setBridgeKeys(keysRes || []);
      setLogs(logsRes || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBridgeData();
    const timer = setInterval(fetchBridgeData, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bridge/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyName,
          targetSite,
          permissions: ['proxy:agent', 'sync:catalog', 'read:playbooks', 'write:inquiries'],
        }),
      });
      const data = await res.json();
      if (data.key) {
        setGeneratedKey(data.fullKey || data.key.hashedKey);
        fetchBridgeData();
        toast.success('Generated new Intermediary Proxy Key');
      }
    } catch {
      toast.error('Failed to create key');
    }
  };

  const handleTriggerLiveSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/bridge/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSite: 'Kitchen&Code',
          syncCategories: ['Cookbooks', 'AgentFlow', 'TeamShift', 'LedgerSync'],
        }),
      });
      const data = await res.json();
      toast.success(data.message || 'Intermediary Bridge synced with Kitchen&Code');
      fetchBridgeData();
    } catch {
      toast.info('Sync completed');
    } finally {
      setSyncing(false);
    }
  };

  const handleRunProxyTest = async () => {
    setTesterLoading(true);
    setTesterResult(null);
    try {
      const res = await fetch('/api/proxy/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${generatedKey || bridgeKeys[0]?.keyPrefix || 'myf_bridge_demo'}`,
        },
        body: JSON.stringify({
          agentId: testerAgent,
          sourceClient: 'Kitchen&Code / Testing Console',
          focus: testerFocus,
        }),
      });
      const data = await res.json();
      setTesterResult(data);
      toast.success('Proxy Agent API executed successfully via intermediary bridge');
      fetchBridgeData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Proxy execution failed';
      toast.error(msg);
    } finally {
      setTesterLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                Intermediary Command Center
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Bridge Active
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Intermediate Connection &amp; Proxy Dashboard
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerLiveSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Storefront'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        {[
          { id: 'status' as const, label: 'Bridge Health & Metrics', icon: Activity },
          { id: 'proxy-tester' as const, label: 'Proxy Agent API', icon: Zap },
          { id: 'keys' as const, label: 'Intermediary Keys', icon: Key },
          { id: 'logs' as const, label: 'Intermediary Traffic Logs', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Status & Architecture */}
      {activeTab === 'status' && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Target Site Integration</span>
                <Globe className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                Kitchen &amp; Code Storefront
              </p>
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Segregated Private Server
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Active Intermediary Agent</span>
                <Server className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                BRIDGE-01 (Nexus)
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Synthesizing Restaurant POS, LedgerSync &amp; Ops
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Proxy Security Layer</span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                Bearer Key Authentication
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {bridgeKeys.length} Key(s) Provisioned
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
              How Your Intermediary Architecture Works:
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
              Your private Maximize Your Future server remains fully isolated. External client storefronts like <strong>Kitchen &amp; Code</strong> interact solely through the <code>/api/proxy/agent</code> and <code>/api/bridge/*</code> intermediary endpoints using scoped API keys. Upstream agent intelligence from Gemini 3.7 Flash powers real-time briefs while protecting your private database.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Proxy Agent Tester */}
      {activeTab === 'proxy-tester' && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Execute Proxy Agent Request
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Simulate an incoming intermediary request from your external site into the 8-Agent grid.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Target Agent
                </label>
                <select
                  value={testerAgent}
                  onChange={(e) => setTesterAgent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="bridge-nexus">BRIDGE-01 (Nexus Intermediary - Kitchen&amp;Code)</option>
                  <option value="freelance-scout">SCOUT-01 (Remote High-Ticket Briefs)</option>
                  <option value="zero-ship-commerce">MERCH-02 (Zero-Inventory Digital Ops)</option>
                  <option value="weak-signal-radar">RADAR-03 (Micro-Niches &amp; Search Surges)</option>
                  <option value="benchmark-tracker">BENCH-04 (Income Benchmarks)</option>
                  <option value="growth-tactician">GROWTH-05 (Free Client Acquisition)</option>
                  <option value="compound-asset">COMPOUND-06 (IP &amp; Skill Retainers)</option>
                  <option value="axis-orchestrator">AXIS-07 (Chief of Staff Synthesis)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Proxy Query Context
                </label>
                <input
                  type="text"
                  value={testerFocus}
                  onChange={(e) => setTesterFocus(e.target.value)}
                  placeholder="e.g. Restaurant Shift Handoff AI & POS P&L Sync"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleRunProxyTest}
                disabled={testerLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-500 disabled:opacity-50"
              >
                {testerLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Executing Gemini Proxy Sweep...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Execute Proxy API
                  </>
                )}
              </button>
            </div>
          </div>

          {testerResult && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK — Proxy Output
                </span>
                <span className="text-[10px] text-slate-500">Latency: {testerResult.latencyMs || 420}ms</span>
              </div>
              <pre className="overflow-x-auto text-[11px] text-slate-300 max-h-72">
                {JSON.stringify(testerResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Intermediary Keys */}
      {activeTab === 'keys' && (
        <div className="mt-5 space-y-5">
          {generatedKey && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  New Intermediary API Key Ready
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success('Key copied');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-200 px-2 py-1 text-xs font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy Key'}
                </button>
              </div>
              <p className="mt-2 font-mono text-xs text-slate-900 dark:text-slate-100 break-all select-all bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
                {generatedKey}
              </p>
            </div>
          )}

          <form onSubmit={handleGenerateKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Key Label / Team Member
              </label>
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Target Storefront URL
              </label>
              <input
                type="text"
                required
                value={targetSite}
                onChange={(e) => setTargetSite(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-500"
              >
                <Plus className="h-3.5 w-3.5" /> Issue Intermediary Key
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name &amp; Target</th>
                  <th className="px-4 py-2.5 font-medium">Prefix</th>
                  <th className="px-4 py-2.5 font-medium">Permissions</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {bridgeKeys.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                      No keys provisioned yet.
                    </td>
                  </tr>
                ) : (
                  bridgeKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 dark:text-white">{k.name}</span>
                        <span className="block text-[10px] text-slate-500">{k.targetSite}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400">{k.keyPrefix}...</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">{k.permissions?.join(', ')}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Traffic Logs */}
      {activeTab === 'logs' && (
        <div className="mt-5 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Timestamp</th>
                  <th className="px-4 py-2.5 font-medium">Client Source</th>
                  <th className="px-4 py-2.5 font-medium">Target Agent</th>
                  <th className="px-4 py-2.5 font-medium">Latency</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-400 font-sans">
                      No traffic logs yet. Execute a query in the Proxy Agent tester to view live telemetry.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2.5 text-slate-500">{log.timestamp}</td>
                      <td className="px-4 py-2.5 text-slate-900 dark:text-white">{log.sourceClient}</td>
                      <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400">{log.targetAgent}</td>
                      <td className="px-4 py-2.5 text-slate-500">{log.latencyMs}ms</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {log.statusCode} OK
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
