import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getDatabase } from './db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  role: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  expires_at: string;
  issued_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  device_label: string | null;
}

// Augment Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser | null;
      session?: UserSession | null;
      requestId?: string;
    }
  }
}

// Helper to hash session tokens at rest
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Password hashing with PBKDF2 (100,000 iterations of SHA-512)
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Constant-time password verification to prevent timing attacks
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const checkBuf = Buffer.from(checkHash, 'hex');
    if (hashBuf.length !== checkBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuf, checkBuf);
  } catch {
    return false;
  }
}

// Session Creation - Hashes token at rest, returns raw token only once
export function createSession(
  userId: string,
  deviceOptions?: string | { ipAddress?: string; userAgent?: string }
): { token: string; sessionToken: string; expiresAt: string } {
  const db = getDatabase();
  const rawToken = 'myf_sess_' + crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const id = 'sess_' + crypto.randomBytes(12).toString('hex');

  const label = typeof deviceOptions === 'string'
    ? deviceOptions
    : (deviceOptions?.userAgent?.slice(0, 100) || 'Standard Session');

  const stmt = db.prepare(`
    INSERT INTO sessions (id, token, token_hash, user_id, expires_at, created_at, issued_at, last_used_at, revoked_at, device_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `);
  stmt.run(id, tokenHash, tokenHash, userId, expiresAt, now, now, now, label);

  return { token: rawToken, sessionToken: rawToken, expiresAt };
}

export function validateSession(rawToken: string): { userId: string; user: AuthenticatedUser; session: UserSession } | null {
  const result = getSessionUser(rawToken);
  if (!result) return null;
  return { userId: result.user.id, user: result.user, session: result.session };
}

// Revoke a specific session by raw token
export function deleteSession(rawToken: string): void {
  const db = getDatabase();
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE sessions
    SET revoked_at = ?
    WHERE token_hash = ? OR token = ?
  `).run(now, tokenHash, rawToken);

  // Hard delete revoked/expired session
  db.prepare('DELETE FROM sessions WHERE token_hash = ? OR token = ?').run(tokenHash, rawToken);
}

// Revoke all sessions for a user (e.g. on password change or security reset)
export function revokeAllUserSessions(userId: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE sessions
    SET revoked_at = ?
    WHERE user_id = ?
  `).run(now, userId);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

// Get user from incoming raw Bearer token
export function getSessionUser(rawToken: string): { user: AuthenticatedUser; session: UserSession } | null {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const db = getDatabase();
  const tokenHash = hashSessionToken(rawToken);
  const nowTime = Date.now();
  const nowIso = new Date().toISOString();

  // Check both token_hash and fallback raw token for backward compatibility
  const sessionRow = db.prepare(`
    SELECT * FROM sessions
    WHERE (token_hash = ? OR token = ?) AND (revoked_at IS NULL)
  `).get(tokenHash, rawToken) as (Record<string, unknown> & { id: string; user_id: string; expires_at: string; revoked_at?: string }) | undefined;

  if (!sessionRow) return null;

  // Check expiration
  if (new Date(sessionRow.expires_at).getTime() < nowTime) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionRow.id);
    return null;
  }

  // Update last_used_at timestamp
  db.prepare('UPDATE sessions SET last_used_at = ? WHERE id = ?').run(nowIso, sessionRow.id);

  const userRow = db.prepare(`
    SELECT u.id, u.email, u.display_name, u.phone, u.role
    FROM users u
    WHERE u.id = ?
  `).get(sessionRow.user_id) as AuthenticatedUser | undefined;

  if (!userRow) return null;

  const session: UserSession = {
    id: String(sessionRow.id),
    user_id: String(sessionRow.user_id),
    expires_at: String(sessionRow.expires_at),
    issued_at: String(sessionRow.issued_at || sessionRow.created_at || nowIso),
    last_used_at: nowIso,
    revoked_at: sessionRow.revoked_at ? String(sessionRow.revoked_at) : null,
    device_label: sessionRow.device_label ? String(sessionRow.device_label) : null,
  };

  return { user: userRow, session };
}

// Optional Auth Middleware
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token) {
    const authData = getSessionUser(token);
    if (authData) {
      req.user = authData.user;
      req.session = authData.session;
    } else {
      req.user = null;
      req.session = null;
    }
  } else {
    req.user = null;
    req.session = null;
  }
  next();
}

// Strict Authentication Middleware
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized: Valid member authentication session required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }
    next();
  });
}

// Comprehensive Audit Logging
export function recordAuditLog(entry: {
  userId?: string | null;
  action: string;
  target?: string | null;
  outcome: 'SUCCESS' | 'FAILURE' | 'REJECTED';
  requestId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): void {
  try {
    const db = getDatabase();
    const id = 'aud_' + crypto.randomBytes(12).toString('hex');
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target, outcome, request_id, ip, user_agent, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      entry.userId || null,
      entry.action,
      entry.target || null,
      entry.outcome,
      entry.requestId || null,
      entry.ip || null,
      entry.userAgent || null,
      JSON.stringify(entry.metadata || {}),
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
