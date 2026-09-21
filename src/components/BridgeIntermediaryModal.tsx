import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, ShieldCheck, Copy, Check, Zap, Globe, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/google-storage';

interface BridgeIntermediaryModalProps {
  open: boolean;
  onClose: () => void;
}

export const BridgeIntermediaryModal: React.FC<BridgeIntermediaryModalProps> = ({ open, onClose }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [activeKey, setActiveKey] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [isTestingProxy, setIsTestingProxy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Load existing keys
  useEffect(() => {
    if (!open) return;
    fetch('/api/bridge/keys', { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((keys) => {
        if (Array.isArray(keys) && keys.length > 0) {
          setActiveKey(keys[0].key_prefix || keys[0].keyPrefix || 'myf_bridge_...');
        }
      })
      .catch(() => undefined);
  }, [open]);

  if (!open) return null;

  const displayKey = newlyCreatedKey || activeKey || 'myf_bridge_preview_demo';
  const proxyEndpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/proxy/agent` : '/api/proxy/agent';

  const handleGenerateNewKey = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/bridge/keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: 'Kitchen&Code Intermediary Client',
          targetSite: 'https://kitchenandcode.com',
          permissions: ['proxy:agent', 'sync:catalog', 'read:playbooks'],
          rateLimit: 60,
        }),
      });
      const data = await res.json();
      if (data.fullKey) {
        setNewlyCreatedKey(data.fullKey);
        setActiveKey(data.fullKey);
        toast.success('Generated real Intermediary Bridge Key');
      } else {
        toast.error('Failed to create key');
      }
    } catch {
      toast.error('Network error creating bridge key');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, isKey: boolean) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
    toast.success('Copied to clipboard');
  };

  const handleTestProxyCall = async () => {
    setIsTestingProxy(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/proxy/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${displayKey}`,
        },
        body: JSON.stringify({
          agentId: 'freelance-scout',
          sourceClient: 'Kitchen&Code Test Intermediary',
          focus: 'Restaurant Shift Ops & Margin Optimization',
        }),
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
      if (res.ok) {
        toast.success('Bridge Proxy Agent executed successfully');
      } else {
        toast.error(data.error || 'Proxy request returned an error');
      }
    } catch {
      toast.error('Network error executing proxy agent test');
    } finally {
      setIsTestingProxy(false);
    }
  };

  const modalContent = (
    /* Modal Backdrop & Outer Centering Wrapper */
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0"
    >
      {/* Modal Card Content */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Close button pinned top right */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 opacity-70 hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content Header & Body */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Intermediary Bridge Connection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Securely interface Kitchen &amp; Code and external client storefronts with your private agent grid.
            </p>
          </div>
        </div>

        {/* Details grid & code block */}
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Isolated Architectural Boundary &amp; Hashed Persistence
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
              Your server database and API secrets remain strictly confidential. Only cryptographically hashed SHA-256 tokens are persisted in storage. External callers access agents exclusively over authenticated Proxy Agent routes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Proxy Agent API Endpoint (POST)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="flex-1 truncate">{proxyEndpoint}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(proxyEndpoint, false)}
                  className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  {copiedEndpoint ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedEndpoint ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Intermediary Bearer Token
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNewKey}
                  disabled={isGenerating}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  New Key
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="flex-1 truncate">{displayKey}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(displayKey, true)}
                  className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  {copiedKey ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {newlyCreatedKey && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
              <span className="font-semibold">Security Notice:</span> Make sure to copy this raw secret key now. For safety, only the hashed representation is stored in the database.
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Example cURL Integration Payload
              </h5>
              <button
                type="button"
                onClick={handleTestProxyCall}
                disabled={isTestingProxy}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-xs font-semibold shadow-sm transition disabled:opacity-60"
              >
                {isTestingProxy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                {isTestingProxy ? 'Testing...' : 'Test Proxy Execution'}
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
{`curl -X POST "${proxyEndpoint}" \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "freelance-scout",
    "sourceClient": "Kitchen&Code",
    "focus": "Restaurant Shift Ops & Margin Optimization"
  }'`}
            </pre>
            {testResult && (
              <div className="mt-3">
                <div className="text-[10px] font-bold text-slate-500 mb-1">Live Proxy Response:</div>
                <pre className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 max-h-40 overflow-y-auto">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

