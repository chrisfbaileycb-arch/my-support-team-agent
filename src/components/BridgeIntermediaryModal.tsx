import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowRightLeft, Key, ShieldCheck, Copy, Check, Server, Zap, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface BridgeIntermediaryModalProps {
  open: boolean;
  onClose: () => void;
}

export const BridgeIntermediaryModal: React.FC<BridgeIntermediaryModalProps> = ({ open, onClose }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const sampleKey = 'myf_bridge_live_849204918204';
  const proxyEndpoint = `${window.location.origin}/api/proxy/agent`;

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-400">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Intermediary Bridge Connection
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Securely interface Kitchen &amp; Code and external client storefronts with your private agent grid.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Isolated Architectural Boundary
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
              Your server database and Google credentials remain strictly confidential. External webhooks communicate exclusively over authenticated Proxy Agent routes.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Proxy Agent API Endpoint (POST)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              <Globe className="h-4 w-4 text-slate-400 shrink-0" />
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
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Intermediary Bearer Token
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              <Key className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="flex-1 truncate">{sampleKey}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(sampleKey, true)}
                className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                {copiedKey ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copiedKey ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Example cURL Integration Payload
            </h5>
            <pre className="text-[10px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto leading-relaxed bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
{`curl -X POST "${proxyEndpoint}" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "bridge-nexus",
    "sourceClient": "Kitchen&Code",
    "focus": "Restaurant Shift Ops & LedgerSync"
  }'`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
