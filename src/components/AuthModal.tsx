import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Mail, Lock, User as UserIcon, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { COVENANT, BRAND } from '@/data/covenant';

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<Props> = ({ open, onClose, initialMode = 'signin' }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Sync mode if prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Handle escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim() || !password) {
      setError('Email and password are both needed.');
      return;
    }
    if (mode === 'signup' && !agreed) {
      setError('The covenant must be accepted before an account can be created.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp({ email: email.trim(), password, name: name.trim(), phone: phone.trim() });
        // Member list dispatch via native Google endpoint
        fetch('/api/briefing/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim() || undefined,
            phone: phone.trim() || undefined,
            sms_opt_in: smsOptIn === true,
            source: 'signup',
          }),
        }).catch(() => undefined);
        setNotice('Welcome. Your covenant acceptance is saved to your account.');
        setTimeout(onClose, 900);
      } else {
        await signIn(email.trim(), password);
        onClose();
      }
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200';

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 opacity-70 transition hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
          {mode === 'signin' ? 'Welcome back' : `Join ${BRAND.name}`}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {mode === 'signin'
            ? 'Sign in to keep your schedules, pipeline and reports across every device.'
            : 'Membership is granted on one condition: kindness — to people and to the agents who serve you.'}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'signup' && (
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />
            </div>
          )}

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className={field}
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className={field}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className={field}
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-xl bg-sky-50/70 p-3 text-xs text-slate-600 dark:bg-sky-950/40 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-500"
                />
                <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
              </label>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/40">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> The covenant
                </div>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {COVENANT.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{c.title}.</span>{' '}
                      {c.body.split('.')[0]}.
                    </li>
                  ))}
                </ul>
                <label className="mt-3 flex items-start gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-500"
                  />
                  <span>I accept all four clauses. My acceptance is recorded with my account.</span>
                </label>
              </div>
            </>
          )}

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">{error}</p>}
          {notice && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-600 hover:to-emerald-600 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign in' : 'Create my account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
          }}
          className="mt-4 w-full text-center text-xs text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          {mode === 'signin' ? 'New here? Create an account' : 'Already a member? Sign in'}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AuthModal;
