import crypto from 'node:crypto';
import { getDatabase } from './db';
import { executeAgentSweep } from './agents';
import { recordAuditLog } from './auth';

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
  claimed_at: string | null;
  claimed_by: string | null;
  lease_expires_at: string | null;
  execution_state: string;
  created_at: string;
  updated_at: string;
}

let schedulerTimer: NodeJS.Timeout | null = null;
const WORKER_ID = `worker_${process.pid}_${crypto.randomBytes(4).toString('hex')}`;
const LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minute execution lease
const MAX_RETRY_COUNT = 3;

/**
 * Calculates next run timestamp honoring user IANA timezone.
 * Standard target hour is 06:00 in the user's configured timezone.
 */
export function calculateNextRun(cadence: string, fromDate = new Date(), timezone = 'UTC'): string {
  const c = cadence.toLowerCase();

  // Validate timezone or fallback to UTC
  let validTz = timezone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: validTz });
  } catch {
    validTz = 'UTC';
  }

  if (c.includes('hourly') || c.includes('1h')) {
    return new Date(fromDate.getTime() + 60 * 60 * 1000).toISOString();
  }

  // Compute current date components in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: validTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(fromDate);
  const getPart = (type: string) => {
    const p = parts.find((pt) => pt.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  const tzYear = getPart('year');
  const tzMonth = getPart('month') - 1; // 0-indexed
  const tzDay = getPart('day');

  // Next target day in user timezone
  const targetDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, 6, 0, 0, 0));

  if (c.includes('weekday')) {
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    const day = targetDate.getUTCDay();
    if (day === 6) targetDate.setUTCDate(targetDate.getUTCDate() + 2); // Saturday -> Monday
    else if (day === 0) targetDate.setUTCDate(targetDate.getUTCDate() + 1); // Sunday -> Monday
  } else if (c.includes('week') || c.includes('7d')) {
    targetDate.setUTCDate(targetDate.getUTCDate() + 7);
  } else {
    // Default: daily / 24h
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }

  // Convert target wall-clock 06:00 in validTz back to UTC
  // We approximate UTC offset by comparing formatted strings
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: validTz,
    timeZoneName: 'shortOffset',
  });
  const tzNamePart = offsetFormatter.formatToParts(targetDate).find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  
  // Parse GMT offset, e.g. "GMT-4" or "GMT+5:30"
  let offsetMinutes = 0;
  const match = tzNamePart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (match) {
    const sign = match[1] === '-' ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    offsetMinutes = sign * (hours * 60 + mins);
  }

  // If local is UTC+offset, UTC = local - offset
  const utcTargetMs = targetDate.getTime() - offsetMinutes * 60 * 1000;
  return new Date(utcTargetMs).toISOString();
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

/**
 * Executes due schedules using atomic database-backed lease claiming.
 * Prevents concurrent runs across instances or worker threads.
 */
export async function tickScheduler(): Promise<number> {
  const db = getDatabase();
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const leaseExpiresAt = new Date(nowMs + LEASE_DURATION_MS).toISOString();

  // Find enabled schedules that are due and not actively claimed by an unexpired lease
  const dueSchedules = (db.prepare(`
    SELECT * FROM schedules
    WHERE enabled = 1
      AND next_run_at <= ?
      AND (claimed_at IS NULL OR lease_expires_at < ?)
      AND execution_state != 'FAILED_MAX_RETRIES'
    ORDER BY next_run_at ASC
    LIMIT 5
  `).all(now, now) as unknown) as ScheduleRecord[];

  let executedCount = 0;

  for (const schedule of dueSchedules) {
    // Attempt atomic database lease claim
    const claimStmt = db.prepare(`
      UPDATE schedules
      SET claimed_at = ?, claimed_by = ?, lease_expires_at = ?, execution_state = 'CLAIMED', updated_at = ?
      WHERE id = ? AND (claimed_at IS NULL OR lease_expires_at < ?)
    `);

    const claimResult = claimStmt.run(now, WORKER_ID, leaseExpiresAt, now, schedule.id, now);
    if (claimResult.changes === 0) {
      // Already claimed by another worker or process
      continue;
    }

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
      const nextRunAt = calculateNextRun(schedule.cadence, new Date(), schedule.timezone || 'UTC');

      db.prepare(`
        UPDATE schedule_executions
        SET completed_at = ?, status = ?, run_id = ?
        WHERE id = ?
      `).run(completedAt, runResult.status === 'complete' ? 'success' : 'simulated', runResult.run_id, execId);

      // Release claim and schedule next run
      db.prepare(`
        UPDATE schedules
        SET last_run_at = ?, next_run_at = ?, failure_count = 0, last_error = NULL,
            claimed_at = NULL, claimed_by = NULL, lease_expires_at = NULL,
            execution_state = 'IDLE', updated_at = ?
        WHERE id = ?
      `).run(completedAt, nextRunAt, completedAt, schedule.id);

      executedCount++;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Execution failed';
      const completedAt = new Date().toISOString();
      const nextFailureCount = (schedule.failure_count || 0) + 1;

      // Exponential / staged backoff: 15m, 1h, 4h
      let backoffMs = 15 * 60 * 1000;
      if (nextFailureCount === 2) backoffMs = 60 * 60 * 1000;
      else if (nextFailureCount >= 3) backoffMs = 4 * 60 * 60 * 1000;

      const retryNext = new Date(Date.now() + backoffMs).toISOString();
      const isTerminal = nextFailureCount >= MAX_RETRY_COUNT;
      const finalState = isTerminal ? 'FAILED_MAX_RETRIES' : 'IDLE';

      db.prepare(`
        UPDATE schedule_executions
        SET completed_at = ?, status = 'failed', error = ?
        WHERE id = ?
      `).run(completedAt, errMsg, execId);

      db.prepare(`
        UPDATE schedules
        SET failure_count = ?, last_error = ?, next_run_at = ?,
            claimed_at = NULL, claimed_by = NULL, lease_expires_at = NULL,
            execution_state = ?, updated_at = ?
        WHERE id = ?
      `).run(nextFailureCount, errMsg, retryNext, finalState, completedAt, schedule.id);

      recordAuditLog({
        userId: schedule.user_id,
        action: 'SCHEDULE_EXECUTION_FAILURE',
        target: schedule.agent_id,
        outcome: 'FAILURE',
        metadata: {
          scheduleId: schedule.id,
          failureCount: nextFailureCount,
          isTerminal,
          nextRetryAt: retryNext,
          error: errMsg,
        },
      });
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
