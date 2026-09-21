import { supabase } from '@/lib/supabase';
import { db, doc, setDoc, updateDoc, deleteDoc } from '@/lib/firebase';
import type { Opportunity, AgentId } from '@/data/agents';

export type PipelineStatus = 'new' | 'researching' | 'executing' | 'won' | 'dropped';

export interface PipelineStage {
  id: PipelineStatus;
  label: string;
  hint: string;
  accentHex: string;
  chip: string;
}

/** Single source of truth for the kanban flow. */
export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'new', label: 'New', hint: 'Bookmarked, not triaged yet', accentHex: '#64748B', chip: 'bg-slate-500' },
  { id: 'researching', label: 'Researching', hint: 'Validating demand and fit', accentHex: '#3B82F6', chip: 'bg-blue-500' },
  { id: 'executing', label: 'Executing', hint: 'Playbook in motion', accentHex: '#F59E0B', chip: 'bg-amber-500' },
  { id: 'won', label: 'Won', hint: 'Money or traction landed', accentHex: '#10B981', chip: 'bg-emerald-500' },
  { id: 'dropped', label: 'Dropped', hint: 'Killed on purpose', accentHex: '#EF4444', chip: 'bg-red-500' },
];

export const STAGE_MAP: Record<PipelineStatus, PipelineStage> = PIPELINE_STAGES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<PipelineStatus, PipelineStage>
);

export interface SavedOpportunity {
  id: string;
  owner_key: string;
  user_id: string | null;
  agent_id: string;
  title: string;
  source: string | null;
  source_url: string | null;
  summary: string | null;
  difficulty: number | null;
  score: number | null;
  payout: string | null;
  time_to_value: string | null;
  tags: string[] | null;
  playbook: string[] | null;
  status: PipelineStatus;
  created_at: string;
}

const OWNER_STORAGE_KEY = 'opus5_owner_key';

/** Stable per-browser operator key used before a member signs in. */
export const getOwnerKey = (): string => {
  if (typeof window === 'undefined') return 'anonymous';
  let key = window.localStorage.getItem(OWNER_STORAGE_KEY);
  if (!key) {
    key = `op_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(OWNER_STORAGE_KEY, key);
  }
  return key;
};

export const fetchSaved = async (userId?: string | null): Promise<SavedOpportunity[]> => {
  let q = supabase.from('saved_opportunities').select('*').order('created_at', { ascending: false });
  q = userId ? q.eq('user_id', userId) : q.is('user_id', null).eq('owner_key', getOwnerKey());
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []) as SavedOpportunity[];
};

export const insertSaved = async (
  opp: Opportunity,
  agentId: AgentId | string,
  userId?: string | null
): Promise<SavedOpportunity> => {
  const payload = {
    owner_key: getOwnerKey(),
    user_id: userId ?? null,
    agent_id: agentId,
    title: opp.title,
    source: opp.source,
    source_url: opp.sourceUrl,
    summary: opp.summary,
    difficulty: opp.difficulty,
    score: opp.score,
    payout: opp.payout,
    time_to_value: opp.timeToValue,
    tags: opp.tags || [],
    playbook: opp.playbook || [],
    status: 'new' as PipelineStatus,
  };
  const { data, error } = await supabase.from('saved_opportunities').insert(payload).select().single();
  if (error) throw new Error(error.message);
  
  // Real-time Firestore sync
  try {
    const firestoreId = data.id || `pipe_${Date.now()}`;
    await setDoc(doc(db, 'pipeline_items', firestoreId), {
      ...payload,
      id: firestoreId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore pipeline sync deferred:', err);
  }

  return data as SavedOpportunity;
};

export const updateSavedStatus = async (id: string, status: PipelineStatus): Promise<void> => {
  const { error } = await supabase.from('saved_opportunities').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);

  // Real-time Firestore sync
  try {
    await updateDoc(doc(db, 'pipeline_items', id), {
      status,
      updated_at: new Date().toISOString(),
    });
  } catch {
    /* silent fallback */
  }
};

export const deleteSaved = async (id: string): Promise<void> => {
  const { error } = await supabase.from('saved_opportunities').delete().eq('id', id);
  if (error) throw new Error(error.message);

  // Real-time Firestore sync
  try {
    await deleteDoc(doc(db, 'pipeline_items', id));
  } catch {
    /* silent fallback */
  }
};

/** Move anything saved on this browser before sign-in onto the member's account. */
export const claimLegacySaved = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .update({ user_id: userId })
    .is('user_id', null)
    .eq('owner_key', getOwnerKey())
    .select('id');
  if (error) return 0;
  return (data || []).length;
};
