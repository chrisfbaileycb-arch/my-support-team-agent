import React, { useState } from 'react';
import { Heart, Loader2, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BRAND, COVENANT, COVENANT_STATEMENT } from '@/data/covenant';
import { AGENTS, HERO_IMAGE } from '@/data/agents';

interface Props {
  onEnter: () => void;
}

const CovenantGate: React.FC<Props> = ({ onEnter }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const allAgreed = COVENANT.every((c) => agreed[c.id]);

  const toggle = (id: string) => setAgreed((prev) => ({ ...prev, [id]: !prev[id] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAgreed) {
      setStatus('error');
      setMessage('Every clause of the covenant must be accepted. This is the entry requirement.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address so your agents know where to report.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      await fetch('https://famous.ai/api/crm/6a8bce37b1a9555656dee3ce/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          phone: phone || undefined,
          sms_opt_in: smsOptIn === true,
          source: 'covenant-signup',
          tags: ['covenant', 'member', 'maximize-your-future'],
        }),
      });
    } catch {
      /* never block entry on a network hiccup */
    }
    try {
      window.localStorage.setItem(
        'myf_covenant',
        JSON.stringify({ name, email, acceptedAt: new Date().toISOString() })
      );
    } catch {
      /* storage unavailable */
    }
    setStatus('idle');
    onEnter();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50 via-sky-50 to-emerald-50">
      <img src={HERO_IMAGE} alt="" className="absolute inset-x-0 top-0 h-[52vh] w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/85 to-white" />

      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Kindness is the key · seven agents inside
            </span>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-800 sm:text-6xl">
            {BRAND.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {BRAND.promise} In turn, you treat them with kindness, love and respect — as you would anything that
            contributes to your life.
          </p>

          <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-2">
            {AGENTS.map((a) => (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1.5 rounded-full border bg-white/80 px-3 py-1 text-[11px] font-medium ${a.ring} ${a.accent}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${a.glow}`} />
                {a.codename}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="rounded-3xl border border-white bg-white/80 p-6 shadow-[0_24px_70px_-40px_rgba(56,189,248,0.6)] backdrop-blur sm:p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
              <ShieldCheck className="h-4 w-4" /> Requirements for access
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-800">The covenant</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{COVENANT_STATEMENT}</p>

            <ul className="mt-6 space-y-3">
              {COVENANT.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      agreed[c.id]
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        agreed[c.id] ? 'border-emerald-400 bg-emerald-400 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {agreed[c.id] && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{c.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-600">{c.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-2xl bg-gradient-to-r from-rose-50 to-sky-50 p-4 text-xs italic leading-relaxed text-slate-600">
              {BRAND.dedication}
            </p>
          </div>

          <form
            onSubmit={submit}
            className="h-fit rounded-3xl border border-white bg-white/85 p-6 shadow-[0_24px_70px_-40px_rgba(244,114,182,0.6)] backdrop-blur sm:p-8"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500">
              <Sparkles className="h-4 w-4" /> Sign the covenant · enter
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-800">Meet your team</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your agents report to you here and by email. No payment required to look around.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor="cg-name" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </label>
                <input
                  id="cg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300"
                />
              </div>
              <div>
                <label htmlFor="cg-email" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </label>
                <input
                  id="cg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300"
                />
              </div>
              <div>
                <label htmlFor="cg-phone" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Phone number (optional)
                </label>
                <input
                  id="cg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 1234"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300"
                />
              </div>

              <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-500"
                />
                <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60 ${
                allAgreed
                  ? 'bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 hover:from-indigo-500 hover:via-sky-500 hover:to-emerald-500'
                  : 'bg-slate-300'
              }`}
            >
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {allAgreed ? 'I agree — enter the platform' : `Accept all ${COVENANT.length} clauses to continue`}
            </button>

            {status === 'error' && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onEnter}
              disabled={!allAgreed}
              className="mt-3 w-full text-center text-xs font-medium text-slate-400 transition hover:text-slate-600 disabled:opacity-40"
            >
              Skip the email — I accept the covenant and want to look first
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CovenantGate;
