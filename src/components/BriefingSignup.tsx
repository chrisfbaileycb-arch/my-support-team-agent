import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AGENTS } from '@/data/agents';

const BriefingSignup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Enter a valid email address.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('https://famous.ai/api/crm/6a8bce37b1a9555656dee3ce/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          phone: phone || undefined,
          sms_opt_in: smsOptIn === true,
          source: 'daily-briefing-signup',
          tags: ['newsletter', 'daily-briefing', 'agent-platform'],
        }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      setStatus('done');
      setMessage('You are on the list. The next swarm briefing lands at 06:00 local.');
      setName('');
      setEmail('');
      setPhone('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Try again in a moment.');
    }
  };

  return (
    <section id="briefing" className="border-b border-white/10 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                <Mail className="h-3.5 w-3.5" /> Daily briefing
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get all 15 ranked opportunities every morning
              </h2>
              <p className="mt-3 text-slate-400">
                One email. Three findings from each of the five agents, each with its difficulty score, value range and
                five-step playbook. Nothing is auto-actioned — you stay the decision-maker.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {AGENTS.map((a) => (
                  <span
                    key={a.id}
                    className={`rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[11px] ${a.accent}`}
                  >
                    {a.codename}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
              <div>
                <label htmlFor="bn" className="text-[11px] uppercase tracking-wider text-slate-500">Name</label>
                <input
                  id="bn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-white/30"
                />
              </div>
              <div>
                <label htmlFor="be" className="text-[11px] uppercase tracking-wider text-slate-500">Email</label>
                <input
                  id="be"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-white/30"
                />
              </div>
              <div>
                <label htmlFor="bp" className="text-[11px] uppercase tracking-wider text-slate-500">
                  Phone number (optional)
                </label>
                <input
                  id="bp"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 1234"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-white/30"
                />
              </div>

              <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 accent-emerald-500"
                />
                <span>
                  Text me high-priority signals. Msg &amp; data rates may apply. Reply STOP to unsubscribe.
                </span>
              </label>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:opacity-60"
              >
                {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === 'loading' ? 'Subscribing…' : 'Send me the daily briefing'}
              </button>

              {status === 'done' && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BriefingSignup;
