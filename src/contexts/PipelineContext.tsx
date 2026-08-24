import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Opportunity, AgentId } from '@/data/agents';
import {
  fetchSaved,
  insertSaved,
  updateSavedStatus,
  deleteSaved,
  type SavedOpportunity,
  type PipelineStatus,
} from '@/lib/pipeline';

interface PipelineContextValue {
  saved: SavedOpportunity[];
  loading: boolean;
  error: string;
  savingId: string | null;
  isSaved: (title: string) => boolean;
  bookmark: (opp: Opportunity, agentId: AgentId | string) => Promise<void>;
  setStatus: (id: string, status: PipelineStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const PipelineContext = createContext<PipelineContextValue | undefined>(undefined);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [saved, setSaved] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError('');
      const rows = await fetchSaved();
      setSaved(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSaved = useCallback(
    (title: string) => saved.some((s) => s.title.toLowerCase() === title.toLowerCase()),
    [saved]
  );

  const bookmark = useCallback(
    async (opp: Opportunity, agentId: AgentId | string) => {
      if (isSaved(opp.title)) return;
      setSavingId(opp.id);
      try {
        const row = await insertSaved(opp, agentId);
        setSaved((prev) => [row, ...prev]);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSavingId(null);
      }
    },
    [isSaved]
  );

  const setStatus = useCallback(async (id: string, status: PipelineStatus) => {
    setSaved((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await updateSavedStatus(id, status);
    } catch (e) {
      setError((e as Error).message);
      refresh();
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const snapshot = saved;
    setSaved((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteSaved(id);
    } catch (e) {
      setError((e as Error).message);
      setSaved(snapshot);
    }
  }, [saved]);

  const value = useMemo(
    () => ({ saved, loading, error, savingId, isSaved, bookmark, setStatus, remove, refresh }),
    [saved, loading, error, savingId, isSaved, bookmark, setStatus, remove, refresh]
  );

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
};

export const usePipeline = (): PipelineContextValue => {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error('usePipeline must be used within a PipelineProvider');
  return ctx;
};
