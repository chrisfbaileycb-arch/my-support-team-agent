import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SCHEDULES, type ScheduleId } from '@/data/covenant';
import type { AgentId } from '@/data/agents';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSchedules, upsertSchedule, upsertManySchedules } from '@/lib/runs';

const STORAGE_KEY = 'myf_agent_schedules';

interface ScheduleContextValue {
  schedules: Record<string, ScheduleId>;
  lastRuns: Record<string, string | null>;
  synced: boolean;
  setSchedule: (agentId: AgentId | string, schedule: ScheduleId) => void;
  setAll: (schedule: ScheduleId) => void;
  resetRecommended: () => void;
  activeCount: number;
}

const ScheduleContext = createContext<ScheduleContextValue | undefined>(undefined);

const load = (): Record<string, ScheduleId> => {
  if (typeof window === 'undefined') return { ...DEFAULT_SCHEDULES };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SCHEDULES };
    return { ...DEFAULT_SCHEDULES, ...(JSON.parse(raw) as Record<string, ScheduleId>) };
  } catch {
    return { ...DEFAULT_SCHEDULES };
  }
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [schedules, setSchedules] = useState<Record<string, ScheduleId>>(load);
  const [lastRuns, setLastRuns] = useState<Record<string, string | null>>({});
  const [synced, setSynced] = useState(false);

  // Persist locally so signed-out visitors keep their rhythm on this browser.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch {
      /* storage unavailable — schedules stay in memory */
    }
  }, [schedules]);

  // On sign-in: pull the member's saved cadences, seeding the account from this browser if empty.
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setSynced(false);
      setLastRuns({});
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const rows = await fetchSchedules(userId);
        if (cancelled) return;
        if (rows.length === 0) {
          await upsertManySchedules(userId, schedules);
          setSynced(true);
          return;
        }
        const next: Record<string, ScheduleId> = { ...DEFAULT_SCHEDULES };
        const runs: Record<string, string | null> = {};
        rows.forEach((r) => {
          next[r.agent_id] = r.cadence;
          runs[r.agent_id] = r.last_run_at;
        });
        setSchedules(next);
        setLastRuns(runs);
        setSynced(true);
      } catch {
        setSynced(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setSchedule = useCallback(
    (agentId: AgentId | string, schedule: ScheduleId) => {
      setSchedules((prev) => ({ ...prev, [agentId]: schedule }));
      if (userId) upsertSchedule(userId, String(agentId), schedule).catch(() => undefined);
    },
    [userId]
  );

  const setAll = useCallback(
    (schedule: ScheduleId) => {
      setSchedules((prev) => {
        const next: Record<string, ScheduleId> = { ...prev };
        Object.keys(next).forEach((k) => {
          next[k] = schedule;
        });
        if (userId) upsertManySchedules(userId, next).catch(() => undefined);
        return next;
      });
    },
    [userId]
  );

  const resetRecommended = useCallback(() => {
    setSchedules({ ...DEFAULT_SCHEDULES });
    if (userId) upsertManySchedules(userId, DEFAULT_SCHEDULES).catch(() => undefined);
  }, [userId]);

  const activeCount = useMemo(
    () => Object.values(schedules).filter((s) => s !== 'paused').length,
    [schedules]
  );

  const value = useMemo(
    () => ({ schedules, lastRuns, synced, setSchedule, setAll, resetRecommended, activeCount }),
    [schedules, lastRuns, synced, setSchedule, setAll, resetRecommended, activeCount]
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};

export const useSchedules = (): ScheduleContextValue => {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedules must be used within a ScheduleProvider');
  return ctx;
};
