import { supabase } from '@/lib/supabase';
import type { AgentId, Opportunity, RetrievedEvidenceItem, ProvenanceState } from '@/data/agents';
import type { ScheduleId } from '@/data/covenant';

export interface RunFinding {
  id?: string;
  rank?: number;
  title?: string;
  source?: string;
  source_name?: string;
  sourceUrl?: string;
  source_url?: string;
  source_type?: string;
  retrieved_at?: string;
  excerpt?: string;
  confidence?: number;
  is_direct_queried?: boolean;
  is_verified?: boolean;
  provenance?: ProvenanceState;
  evidence_type?: string;
  evidence_ids?: string[];
  inference_notes?: string;
  evidence?: RetrievedEvidenceItem[];
  summary?: string;
  difficulty?: number;
  score?: number;
  payout?: string;
  timeToValue?: string;
  time_to_value?: string;
  tags?: string[];
  playbook?: string[];
}

export interface AgentRun {
  id: string;
  user_id: string;
  agent_id: string;
  codename: string | null;
  trigger: string;
  status: string;
  execution_mode?: 'LIVE_RETRIEVAL' | 'MIXED_RETRIEVAL' | 'MODEL_ONLY' | 'SIMULATED';
  headline: string | null;
  warning: string | null;
  findings: RunFinding[];
  evidence?: RetrievedEvidenceItem[];
  evidence_count?: number;
  is_live?: boolean;
  is_fallback?: boolean;
  error: string | null;
  created_at: string;
}

/** Normalise a stored finding into the shared Opportunity shape used across the UI. */
export const toOpportunity = (f: RunFinding, i: number, agentCode: string): Opportunity => ({
  id: f.id || `run-${agentCode}-${i}-${(f.title || '').slice(0, 12)}`,
  rank: Number(f.rank) || i + 1,
  title: f.title || 'Untitled finding',
  source: f.source || f.source_name || agentCode,
  sourceUrl: f.sourceUrl || f.source_url || '#',
  summary: f.summary || '',
  difficulty: Math.min(10, Math.max(1, Number(f.difficulty) || 5)),
  score: Math.min(100, Math.max(0, Number(f.score) || 70)),
  payout: f.payout || '—',
  timeToValue: f.timeToValue || f.time_to_value || '—',
  tags: Array.isArray(f.tags) ? f.tags.slice(0, 4) : [],
  playbook: Array.isArray(f.playbook) ? f.playbook : [],
  provenance: f.provenance,
  is_verified: f.is_verified,
  is_direct_queried: f.is_direct_queried,
  excerpt: f.excerpt,
  retrieved_at: f.retrieved_at,
  evidence_ids: f.evidence_ids,
  inference_notes: f.inference_notes,
  evidence: f.evidence,
});

export const fetchRuns = async (userId: string, limit = 60): Promise<AgentRun[]> => {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as AgentRun[];
};

/** Latest complete run per agent. */
export const latestByAgent = (runs: AgentRun[]): Record<string, AgentRun> => {
  const out: Record<string, AgentRun> = {};
  runs.forEach((r) => {
    if (r.status !== 'complete') return;
    if (!out[r.agent_id]) out[r.agent_id] = r;
  });
  return out;
};

export const triggerRun = async (userId: string, agentId: AgentId | string, focus: string) => {
  const { data, error } = await supabase.functions.invoke('run-schedules', {
    body: { mode: 'manual', userId, agentId, focus },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as { ran: number; runs: AgentRun[] };
};

// ---------------- schedules (database-backed, per member) ----------------

export interface ScheduleRow {
  id: string;
  user_id: string;
  agent_id: string;
  cadence: ScheduleId;
  last_run_at: string | null;
  focus: string | null;
}

export const fetchSchedules = async (userId: string): Promise<ScheduleRow[]> => {
  const { data, error } = await supabase.from('agent_schedules').select('*').eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data || []) as ScheduleRow[];
};

export const upsertSchedule = async (userId: string, agentId: string, cadence: ScheduleId): Promise<void> => {
  const { error } = await supabase
    .from('agent_schedules')
    .upsert(
      { user_id: userId, agent_id: agentId, cadence, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,agent_id' }
    );
  if (error) throw new Error(error.message);
};

export const upsertManySchedules = async (
  userId: string,
  entries: Record<string, ScheduleId>
): Promise<void> => {
  const rows = Object.entries(entries).map(([agent_id, cadence]) => ({
    user_id: userId,
    agent_id,
    cadence,
    updated_at: new Date().toISOString(),
  }));
  if (!rows.length) return;
  const { error } = await supabase.from('agent_schedules').upsert(rows, { onConflict: 'user_id,agent_id' });
  if (error) throw new Error(error.message);
};
