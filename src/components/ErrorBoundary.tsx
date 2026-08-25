import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-slate-950/90 text-slate-100 rounded-3xl border border-rose-900/40 shadow-2xl my-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-950/60 text-rose-400">
              <ShieldAlert className="h-7 w-7" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-100">
              {this.props.fallbackTitle || 'Component Error Intercepted'}
            </h3>

            <p className="text-xs leading-relaxed text-slate-400">
              {this.props.fallbackMessage ||
                'An error occurred in this module boundary. The error was caught safely to protect the rest of your operations dashboard.'}
            </p>

            {this.state.error && (
              <div className="rounded-xl border border-rose-900/30 bg-rose-950/40 p-3 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-28">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Recover View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
