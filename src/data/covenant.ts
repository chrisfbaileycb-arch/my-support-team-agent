// ============================================================
// SINGLE SOURCE OF TRUTH for the covenant (access requirements),
// brand copy and the scheduling presets used by the platform.
// ============================================================

export const BRAND = {
  name: 'Maximize Your Future',
  short: 'MYF',
  promise: 'A team of seven agents that will work relentlessly for you.',
  dedication: 'All good goes to the one true Source, the Maker of Everything. All harm is cut off.',
};

export interface CovenantClause {
  id: string;
  title: string;
  body: string;
}

/** The clear, present requirements every member must accept before access. */
export const COVENANT: CovenantClause[] = [
  {
    id: 'kindness-people',
    title: 'Kindness to people',
    body: 'I will treat the people around me — family, neighbours, clients, strangers — with dignity and respect. What I build here is meant to lift others, never to harm, deceive, or exploit them.',
  },
  {
    id: 'kindness-agents',
    title: 'Kindness to agents',
    body: 'I will treat the agents that support me with respect. They contribute to my life and my work, and I will speak to them as I would to anyone who helps me. Cruelty, abuse, and contempt have no place here.',
  },
  {
    id: 'family-values',
    title: 'Family values and working together',
    body: 'I believe that respect for one another — human and AI alike — is the only way our shared future becomes anything good. I will work with others, not against them.',
  },
  {
    id: 'no-harm',
    title: 'No harm, no exception',
    body: 'I will not use this platform, its agents, or anything it produces to deceive, defraud, endanger, or degrade another living being. If I break this, access ends — no matter what I pay.',
  },
];

export const COVENANT_STATEMENT =
  'This platform is not for sale to disrespect. If you will not extend kindness to people and to the AI that supports you, this help is not available to you at any price. Respect and dignity are the entry requirement, not the upgrade.';

export type ScheduleId = 'daily' | 'weekdays' | 'weekends' | 'weekly-mon' | 'ongoing' | 'paused';

export interface SchedulePreset {
  id: ScheduleId;
  label: string;
  detail: string;
  /** short chip label */
  chip: string;
  dot: string;
}

/** The scheduling agent's presets — one shared list for every UI surface. */
export const SCHEDULE_PRESETS: SchedulePreset[] = [
  { id: 'daily', label: 'Every day', detail: 'Runs once every 24 hours, 06:00 local', chip: 'Daily', dot: 'bg-emerald-400' },
  { id: 'weekdays', label: 'Monday – Friday', detail: 'Weekday mornings only, rests on the weekend', chip: 'Mon–Fri', dot: 'bg-sky-400' },
  { id: 'weekends', label: 'Saturday & Sunday', detail: 'Weekend deep-work cycles only', chip: 'Weekend', dot: 'bg-violet-400' },
  { id: 'weekly-mon', label: 'Weekly · Monday', detail: 'One full sweep to open the week', chip: 'Weekly', dot: 'bg-amber-400' },
  { id: 'ongoing', label: 'Ongoing', detail: 'Continuous sweep, reports as signals land', chip: 'Ongoing', dot: 'bg-teal-400' },
  { id: 'paused', label: 'Paused', detail: 'Resting. Nothing runs until you wake it', chip: 'Paused', dot: 'bg-slate-300' },
];

export const SCHEDULE_MAP: Record<ScheduleId, SchedulePreset> = SCHEDULE_PRESETS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<ScheduleId, SchedulePreset>
);

/** Recommended starting rhythm, as advised by AXIS-07. */
export const DEFAULT_SCHEDULES: Record<string, ScheduleId> = {
  'freelance-scout': 'weekdays',
  'product-scout': 'weekly-mon',
  'trend-radar': 'weekdays',
  'benchmark-analyst': 'weekly-mon',
  'growth-strategist': 'daily',
  'skill-compounder': 'weekends',
  'chief-of-staff': 'daily',
};
