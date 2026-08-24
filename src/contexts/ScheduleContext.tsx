import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SCHEDULES, type ScheduleId } from '@/data/covenant';
import type { AgentId } from '@/data/agents';

const STORAGE_KEY = 'myf_agent_schedules';

interface ScheduleContextValue {
  schedules: Record<string, ScheduleId>;
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
  const [schedules, setSchedules] = useState<Record<string, ScheduleId>>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch {
      /* storage unavailable — schedules stay in memory */
    }
  }, [schedules]);

  const setSchedule = useCallback((agentId: AgentId | string, schedule: ScheduleId) => {
    setSchedules((prev) => ({ ...prev, [agentId]: schedule }));
  }, []);

  const setAll = useCallback((schedule: ScheduleId) => {
    setSchedules((prev) => {
      const next: Record<string, ScheduleId> = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = schedule;
      });
      return next;
    });
  }, []);

  const resetRecommended = useCallback(() => setSchedules({ ...DEFAULT_SCHEDULES }), []);

  const activeCount = useMemo(
    () => Object.values(schedules).filter((s) => s !== 'paused').length,
    [schedules]
  );

  const value = useMemo(
    () => ({ schedules, setSchedule, setAll, resetRecommended, activeCount }),
    [schedules, setSchedule, setAll, resetRecommended, activeCount]
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};

export const useSchedules = (): ScheduleContextValue => {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedules must be used within a ScheduleProvider');
  return ctx;
};
