import { getDatabase } from './db';
import type { Request, Response, NextFunction } from 'express';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // unix ms timestamp
}

export interface IRateLimiter {
  consume(key: string, limit: number, windowMs: number): RateLimitResult;
  reset(key: string): void;
}

export class SqliteRateLimiter implements IRateLimiter {
  consume(key: string, limit: number, windowMs: number): RateLimitResult {
    const db = getDatabase();
    const now = Date.now();
    const newResetTime = now + windowMs;

    // Use a transaction for atomic read-modify-write
    let row = db.prepare('SELECT count, reset_at FROM rate_limit_buckets WHERE key = ?').get(key) as
      | { count: number; reset_at: number }
      | undefined;

    if (!row || now >= row.reset_at) {
      // Window expired or brand new key
      db.prepare(`
        INSERT INTO rate_limit_buckets (key, count, reset_at)
        VALUES (?, 1, ?)
        ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at
      `).run(key, newResetTime);

      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: newResetTime,
      };
    }

    if (row.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: row.reset_at,
      };
    }

    const newCount = row.count + 1;
    db.prepare('UPDATE rate_limit_buckets SET count = ? WHERE key = ?').run(newCount, key);

    return {
      allowed: true,
      remaining: Math.max(0, limit - newCount),
      resetTime: row.reset_at,
    };
  }

  reset(key: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM rate_limit_buckets WHERE key = ?').run(key);
  }

  // Periodic cleanup of expired buckets
  cleanup(): void {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM rate_limit_buckets WHERE reset_at < ?').run(Date.now());
    } catch {
      // ignore
    }
  }
}

export const rateLimiter: IRateLimiter = new SqliteRateLimiter();

export function rateLimitMiddleware(options: {
  prefix: string;
  limit: number;
  windowMs: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.user ? `usr_${req.user.id}` : `ip_${req.ip || req.socket.remoteAddress || 'unknown'}`);

    const bucketKey = `${options.prefix}:${clientKey}`;
    const result = rateLimiter.consume(bucketKey, options.limit, options.windowMs);

    res.setHeader('X-RateLimit-Limit', options.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

    if (!result.allowed) {
      res.status(429).json({
        error: options.message || 'Too many requests. Please slow down and try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000)),
      });
      return;
    }

    next();
  };
}
