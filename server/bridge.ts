import crypto from 'node:crypto';
import { getDatabase } from './db';

export interface BridgeKeyRecord {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  hashed_key: string;
  target_site: string;
  permissions: string[];
  rate_limit_per_minute: number;
  last_used_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ProxyLogRecord {
  id: string;
  user_id: string | null;
  key_id: string | null;
  source_client: string;
  target_agent: string;
  action: string;
  status_code: number;
  latency_ms: number;
  ip_address: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// In-memory rate limiting sliding window per hashed key
const keyUsageBuckets = new Map<string, number[]>();

export function hashBridgeKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateBridgeKey(params: {
  userId: string;
  name: string;
  targetSite?: string;
  permissions?: string[];
  rateLimit?: number;
}): { key: BridgeKeyRecord; fullKey: string } {
  const db = getDatabase();
  const rawKey = 'myf_bridge_' + crypto.randomBytes(24).toString('hex');
  const keyPrefix = rawKey.slice(0, 16);
  const hashedKey = hashBridgeKey(rawKey);
  const id = 'key_' + crypto.randomBytes(10).toString('hex');
  const now = new Date().toISOString();
  const permissions = params.permissions || ['read:playbooks', 'write:opportunities', 'proxy:agent', 'sync:catalog'];
  const rateLimit = params.rateLimit || 60;
  const targetSite = params.targetSite || 'https://kitchenandcode.com';

  const stmt = db.prepare(`
    INSERT INTO bridge_api_keys (
      id, user_id, name, key_prefix, hashed_key, target_site, permissions,
      rate_limit_per_minute, last_used_at, revoked_at, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?)
  `);

  stmt.run(
    id,
    params.userId,
    params.name,
    keyPrefix,
    hashedKey,
    targetSite,
    JSON.stringify(permissions),
    rateLimit,
    now
  );

  const record: BridgeKeyRecord = {
    id,
    user_id: params.userId,
    name: params.name,
    key_prefix: keyPrefix,
    hashed_key: hashedKey,
    target_site: targetSite,
    permissions,
    rate_limit_per_minute: rateLimit,
    last_used_at: null,
    revoked_at: null,
    expires_at: null,
    created_at: now,
  };

  return { key: record, fullKey: rawKey };
}

export function revokeBridgeKey(keyId: string, userId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE bridge_api_keys
    SET revoked_at = ?
    WHERE id = ? AND user_id = ?
  `);
  const res = stmt.run(new Date().toISOString(), keyId, userId);
  return res.changes > 0;
}

export function listBridgeKeys(userId: string): Omit<BridgeKeyRecord, 'hashed_key'>[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, user_id, name, key_prefix, target_site, permissions,
           rate_limit_per_minute, last_used_at, revoked_at, expires_at, created_at
    FROM bridge_api_keys
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    user_id: String(r.user_id),
    name: String(r.name),
    key_prefix: String(r.key_prefix),
    target_site: String(r.target_site),
    permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : [],
    rate_limit_per_minute: Number(r.rate_limit_per_minute) || 60,
    last_used_at: r.last_used_at ? String(r.last_used_at) : null,
    revoked_at: r.revoked_at ? String(r.revoked_at) : null,
    expires_at: r.expires_at ? String(r.expires_at) : null,
    created_at: String(r.created_at),
  }));
}

export function validateBridgeRequest(token: string, requiredPermission?: string): {
  valid: boolean;
  key?: BridgeKeyRecord;
  reason?: string;
} {
  if (!token) {
    return { valid: false, reason: 'Missing authorization token' };
  }

  const hashed = hashBridgeKey(token);
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM bridge_api_keys
    WHERE hashed_key = ?
  `).get(hashed) as Record<string, unknown> | undefined;

  if (!row) {
    return { valid: false, reason: 'Invalid intermediary bridge API key' };
  }

  if (row.revoked_at) {
    return { valid: false, reason: 'Bridge API key has been revoked' };
  }

  if (row.expires_at && new Date(String(row.expires_at)).getTime() < Date.now()) {
    return { valid: false, reason: 'Bridge API key has expired' };
  }

  const permissions: string[] = typeof row.permissions === 'string' ? JSON.parse(row.permissions) : [];
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return { valid: false, reason: `Missing required permission: ${requiredPermission}` };
  }

  // Check rate limit
  const now = Date.now();
  const minuteAgo = now - 60000;
  let timestamps = keyUsageBuckets.get(hashed) || [];
  timestamps = timestamps.filter((t) => t > minuteAgo);
  const limit = Number(row.rate_limit_per_minute) || 60;

  if (timestamps.length >= limit) {
    return { valid: false, reason: `Rate limit exceeded (${limit} req/min)` };
  }

  timestamps.push(now);
  keyUsageBuckets.set(hashed, timestamps);

  // Update last used
  db.prepare('UPDATE bridge_api_keys SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), String(row.id));

  return {
    valid: true,
    key: {
      id: String(row.id),
      user_id: String(row.user_id),
      name: String(row.name),
      key_prefix: String(row.key_prefix),
      hashed_key: hashed,
      target_site: String(row.target_site),
      permissions,
      rate_limit_per_minute: limit,
      last_used_at: new Date().toISOString(),
      revoked_at: null,
      expires_at: row.expires_at ? String(row.expires_at) : null,
      created_at: String(row.created_at),
    },
  };
}

export function logProxyEvent(log: {
  userId?: string | null;
  keyId?: string | null;
  sourceClient: string;
  targetAgent: string;
  action: string;
  statusCode: number;
  latencyMs: number;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}): void {
  try {
    const db = getDatabase();
    const id = 'log_' + crypto.randomBytes(10).toString('hex');
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO proxy_logs (
        id, user_id, key_id, source_client, target_agent, action,
        status_code, latency_ms, ip_address, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      log.userId || null,
      log.keyId || null,
      log.sourceClient,
      log.targetAgent,
      log.action,
      log.statusCode,
      log.latencyMs,
      log.ipAddress || null,
      now,
      JSON.stringify(log.metadata || {})
    );
  } catch (err) {
    console.error('Failed to log proxy event:', err);
  }
}

export function getRecentProxyLogs(limit = 50): ProxyLogRecord[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM proxy_logs
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    user_id: r.user_id ? String(r.user_id) : null,
    key_id: r.key_id ? String(r.key_id) : null,
    source_client: String(r.source_client),
    target_agent: String(r.target_agent),
    action: String(r.action),
    status_code: Number(r.status_code),
    latency_ms: Number(r.latency_ms),
    ip_address: r.ip_address ? String(r.ip_address) : null,
    timestamp: String(r.timestamp),
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : {},
  }));
}
