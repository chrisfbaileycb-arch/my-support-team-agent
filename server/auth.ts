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
  token: string;
  user_id: string;
  expires_at: string;
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

// Password hashing with PBKDF2
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
}

export function createSession(userId: string): { sessionToken: string; expiresAt: string } {
  const db = getDatabase();
  const sessionToken = 'myf_sess_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const id = 'sess_' + crypto.randomBytes(12).toString('hex');

  const stmt = db.prepare('INSERT INTO sessions (id, token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, sessionToken, userId, expiresAt, new Date().toISOString());

  return { sessionToken, expiresAt };
}

export function deleteSession(token: string): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

export function getSessionUser(token: string): { user: AuthenticatedUser; session: UserSession } | null {
  const db = getDatabase();
  const sessionRow = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as UserSession | undefined;
  if (!sessionRow) return null;

  if (new Date(sessionRow.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionRow.id);
    return null;
  }

  const userRow = db.prepare(`
    SELECT u.id, u.email, u.display_name, u.phone, u.role
    FROM users u
    WHERE u.id = ?
  `).get(sessionRow.user_id) as AuthenticatedUser | undefined;

  if (!userRow) return null;
  return { user: userRow, session: sessionRow };
}

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
