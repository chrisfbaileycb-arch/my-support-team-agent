import crypto from 'node:crypto';
import { getDatabase } from './db';
import { executeAgentSweep } from './agents';

export interface ScheduleRecord {
  id: string;
  user_id: string;
  agent_id: string;
  cadence: string;
  enabled: number;
  timezone: string;
  focus: string | null;
  next_run_at: string;
  last_run_at: string | null;
  failure_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

let schedulerTimer: NodeJS.Timeout | null = null;
const activeRunningSchedules = new Set<string>();

export function calculateNextRun(cadence: string, fromDate = new Date()): string {
  const next = new Date(fromDate);
  const c = cadence.toLowerCase();

  if (c.includes('hourly') || c.includes('1h')) {
    next.setHours(next.getHours() + 1);
  } else if (c.includes('weekday')) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();
    if (day === 6) next.setDate(next.getDate() + 2); // Saturday -> Monday
    else if (day === 0) next.setDate(next.getDate() + 1); // Sunday -> Monday
    next.setHours(6, 0, 0, 0);
  } else if (c.includes('week') || c.includes('7d')) {
    next.setDate(next.getDate() + 7);
    next.setHours(6, 0, 0, 0);
  } else {
    // Default: daily / 24h
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
  }
  return next.toISOString();
}

export function startScheduler(intervalMs = 30000): void {
  if (schedulerTimer) return;

  schedulerTimer = setInterval(async () => {
    try {
      await tickScheduler();
    } catch (err) {
      console.error('Scheduler tick error:', err);
    }
  }, intervalMs);

  // Run initial tick after 5 seconds to catch pending jobs
  setTimeout(() => {
    tickScheduler().catch((e) => console.error('Initial scheduler tick error:', e));
  }, 5000);
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

export async function tickScheduler(): Promise<number> {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Find enabled schedules that are due
  const dueSchedules = (db.prepare(`
    SELECT * FROM schedules
    WHERE enabled = 1 AND next_run_at <= ?
    ORDER BY next_run_at ASC
    LIMIT 5
  `).all(now) as unknown) as ScheduleRecord[];

  let executedCount = 0;

  for (const schedule of dueSchedules) {
    if (activeRunningSchedules.has(schedule.id)) continue;
    activeRunningSchedules.add(schedule.id);

    const execId = 'exec_' + crypto.randomBytes(10).toString('hex');
    const startedAt = new Date().toISOString();

    try {
      db.prepare(`
        INSERT INTO schedule_executions (id, schedule_id, user_id, agent_id, started_at, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'running', ?)
      `).run(execId, schedule.id, schedule.user_id, schedule.agent_id, startedAt, startedAt);

      const runResult = await executeAgentSweep({
        userId: schedule.user_id,
        agentId: schedule.agent_id,
        focus: schedule.focus || undefined,
        trigger: 'scheduled',
      });

      const completedAt = new Date().toISOString();
      const nextRunAt = calculateNextRun(schedule.cadence, new Date());

      db.prepare(`
        UPDATE schedule_executions
        SET completed_at = ?, status = ?, run_id = ?
        WHERE id = ?
      `).run(completedAt, runResult.status === 'complete' ? 'success' : 'simulated', runResult.run_id, execId);

      db.prepare(`
        UPDATE schedules
        SET last_run_at = ?, next_run_at = ?, failure_count = 0, last_error = NULL, updated_at = ?
        WHERE id = ?
      `).run(completedAt, nextRunAt, completedAt, schedule.id);

      executedCount++;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Execution failed';
      const completedAt = new Date().toISOString();
      const retryNext = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // retry in 15 mins

      db.prepare(`
        UPDATE schedule_executions
        SET completed_at = ?, status = 'failed', error = ?
        WHERE id = ?
      `).run(completedAt, errMsg, execId);

      db.prepare(`
        UPDATE schedules
        SET failure_count = failure_count + 1, last_error = ?, next_run_at = ?, updated_at = ?
        WHERE id = ?
      `).run(errMsg, retryNext, completedAt, schedule.id);
    } finally {
      activeRunningSchedules.delete(schedule.id);
    }
  }

  return executedCount;
}

export async function triggerManualScheduleRun(scheduleId: string, userId: string) {
  const db = getDatabase();
  const schedule = (db.prepare('SELECT * FROM schedules WHERE id = ? AND user_id = ?').get(scheduleId, userId) as unknown) as ScheduleRecord | undefined;
  if (!schedule) {
    throw new Error('Schedule not found or unauthorized');
  }

  const runResult = await executeAgentSweep({
    userId: schedule.user_id,
    agentId: schedule.agent_id,
    focus: schedule.focus || undefined,
    trigger: 'manual',
  });

  const completedAt = new Date().toISOString();
  db.prepare(`
    UPDATE schedules
    SET last_run_at = ?, updated_at = ?
    WHERE id = ?
  `).run(completedAt, completedAt, schedule.id);

  return runResult;
}
