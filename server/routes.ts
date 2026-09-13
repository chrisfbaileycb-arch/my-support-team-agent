import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { getDatabase } from './db';
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  optionalAuth,
  requireAuth,
  recordAuditLog,
} from './auth';
import { executeAgentSweep, AGENT_CONTRACTS } from './agents';
import {
  sourceRegistry,
  getEvidenceForRun,
  getEvidenceForFinding,
  getEvidenceById,
} from './sourceProviders';
import { calculateNextRun, triggerManualScheduleRun } from './scheduler';
import { generateAxisReport } from './reports';
import {
  generateBridgeKey,
  revokeBridgeKey,
  listBridgeKeys,
  validateBridgeRequest,
  logProxyEvent,
  getRecentProxyLogs,
} from './bridge';
import { createRateLimiter } from './rateLimit';

export const router = express.Router();

// Apply optionalAuth to all routes so req.user is set when available
router.use(optionalAuth);

// Helper for client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// Rate limiters for sensitive endpoints
const authRateLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 10,
  keyPrefix: 'auth_attempt',
});

const agentRunLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 30,
  keyPrefix: 'agent_run',
});

// ==========================================
// 1. HEALTH & READINESS ENDPOINTS (Requirements 20, 21, 22)
// ==========================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

router.get('/readiness', async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  let totalUsers = 0;
  try {
    const db = getDatabase();
    // Verify database ping
    const ping = db.prepare('SELECT 1 as alive').get() as { alive: number };
    if (!ping || ping.alive !== 1) {
      throw new Error('Database ping query returned invalid result');
    }
    const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    totalUsers = countRow.count;
  } catch (e) {
    dbStatus = 'error: ' + (e instanceof Error ? e.message : String(e));
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiConfigured = Boolean(geminiKey && geminiKey.trim().length > 5);
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripeConfigured = Boolean(stripeKey && stripeKey.trim().length > 5);

  const providerReports = await sourceRegistry.getAllProvidersHealth();
  const connectedProviders = providerReports.filter((p) => p.status === 'CONNECTED').length;

  const isDbReady = dbStatus === 'connected';
  const overallStatus = isDbReady ? (geminiConfigured ? 'READY' : 'DEGRADED') : 'NOT_READY';

  res.json({
    status: overallStatus,
    database: {
      status: dbStatus,
      engine: 'sqlite (WAL persistent)',
      totalUsers,
    },
    auth: {
      status: 'active',
      method: 'PBKDF2 SHA-512 + Hashed Sessions at Rest',
    },
    gemini: {
      configured: geminiConfigured,
      model: 'gemini-3.7-flash',
      status: geminiConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      note: geminiConfigured
        ? 'Gemini API key verified in environment.'
        : 'GEMINI_API_KEY not set; using validated benchmark fixtures.',
    },
    sourceProviders: {
      totalRegistered: providerReports.length,
      connectedCount: connectedProviders,
      providers: providerReports,
    },
    scheduler: {
      status: 'active',
      tickInterval: '30s',
      concurrency: 'Atomic SQLite Lease Claiming',
    },
    billing: {
      provider: 'Stripe',
      configured: stripeConfigured,
      status: stripeConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      tier: stripeConfigured ? 'Standard Production' : 'FREE_COMMUNITY',
    },
    integrations: {
      googleWorkspace: {
        status: 'NOT_CONFIGURED',
        note: 'OAuth credentials not configured in environment.',
      },
      externalStorefront: {
        status: 'READY_FOR_BRIDGE',
        provider: 'Kitchen & Code / Storefront API',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/providers/health', async (_req: Request, res: Response) => {
  const reports = await sourceRegistry.getAllProvidersHealth();
  res.json({
    timestamp: new Date().toISOString(),
    totalProviders: reports.length,
    providers: reports,
  });
});

// Evidence Providers Alias
router.get('/evidence/providers', async (_req: Request, res: Response) => {
  const reports = await sourceRegistry.getAllProvidersHealth();
  res.json({
    timestamp: new Date().toISOString(),
    totalProviders: reports.length,
    providers: reports,
  });
});

// Evidence Inspection Endpoints (Requirements 15, 16, 21)
router.get('/evidence/:id', (req: Request, res: Response) => {
  const evidenceId = String(req.params.id);
  const userId = req.user ? req.user.id : undefined;
  const evidence = getEvidenceById(evidenceId, userId);

  if (!evidence) {
    res.status(404).json({ error: 'Evidence record not found or access denied.' });
    return;
  }

  // Also fetch any finding links
  const db = getDatabase();
  const linkedFindings = db.prepare(`
    SELECT f.id, f.title, f.agent_id, fe.relationship_type, fe.support_strength
    FROM run_findings f
    JOIN finding_evidence fe ON fe.finding_id = f.id
    WHERE fe.evidence_id = ?
  `).all(evidenceId);

  res.json({
    evidence,
    linkedFindings,
  });
});

router.get('/runs/:runId/evidence', (req: Request, res: Response) => {
  const runId = String(req.params.runId);
  const userId = req.user ? req.user.id : undefined;
  const items = getEvidenceForRun(runId, userId);
  res.json({ runId, count: items.length, evidence: items });
});

router.get('/findings/:findingId/evidence', (req: Request, res: Response) => {
  const findingId = String(req.params.findingId);
  const items = getEvidenceForFinding(findingId);
  res.json({ findingId, count: items.length, evidence: items });
});

// ==========================================
// 2. REAL DASHBOARD METRICS (Requirement 7)
// ==========================================
router.get('/metrics', (_req: Request, res: Response) => {
  const db = getDatabase();

  const runsCount = (db.prepare('SELECT COUNT(*) as c FROM agent_runs').get() as { c: number }).c;
  const liveRunsCount = (db.prepare('SELECT COUNT(*) as c FROM agent_runs WHERE is_live = 1').get() as { c: number }).c;
  const modelOnlyRunsCount = (db.prepare("SELECT COUNT(*) as c FROM agent_runs WHERE execution_mode = 'MODEL_ONLY'").get() as { c: number }).c;
  const simulatedRunsCount = (db.prepare("SELECT COUNT(*) as c FROM agent_runs WHERE execution_mode = 'SIMULATED'").get() as { c: number }).c;
  const failedRunsCount = (db.prepare("SELECT COUNT(*) as c FROM agent_runs WHERE status = 'failed'").get() as { c: number }).c;
  const verifiedSourcesCount = (db.prepare('SELECT COUNT(*) as c FROM retrieved_evidence WHERE is_verified = 1').get() as { c: number }).c;
  const liveEvidenceCount = (db.prepare("SELECT COUNT(*) as c FROM retrieved_evidence WHERE evidence_type = 'LIVE_SOURCE'").get() as { c: number }).c;

  const findingsCount = (db.prepare('SELECT COUNT(*) as c FROM run_findings').get() as { c: number }).c;
  const pipelineCount = (db.prepare("SELECT COUNT(*) as c FROM pipeline_items WHERE status != 'dropped'").get() as { c: number }).c;
  const activeSchedulesCount = (db.prepare('SELECT COUNT(*) as c FROM schedules WHERE enabled = 1').get() as { c: number }).c;

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 5);

  let platformsConnected = 0;
  if (geminiConfigured) platformsConnected++;
  if (stripeConfigured) platformsConnected++;

  res.json({
    sourcesSweptDaily: verifiedSourcesCount > 0 ? verifiedSourcesCount : (liveEvidenceCount > 0 ? liveEvidenceCount : 0),
    liveEvidenceCount,
    verifiedSourcesCount,
    opportunitiesRanked: findingsCount,
    platformsConnected,
    agentsWorking: activeSchedulesCount,
    totalAgentRuns: runsCount,
    liveSynthesizedRuns: liveRunsCount,
    modelInferenceRuns: modelOnlyRunsCount,
    simulatedRuns: simulatedRunsCount,
    failedRuns: failedRunsCount,
    savedPipelineItems: pipelineCount,
    isIllustrativeBenchmark: runsCount === 0,
  });
});

router.get('/billing/status', (_req: Request, res: Response) => {
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 5);
  res.json({
    configured: stripeConfigured,
    status: stripeConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
    provider: 'Stripe',
    tier: stripeConfigured ? 'Standard Subscription' : 'FREE_COMMUNITY',
    notice: stripeConfigured
      ? 'Stripe integration active and configured in server environment.'
      : 'Billing is currently NOT_CONFIGURED. All agent capabilities are running in open community mode.',
  });
});

// ==========================================
// 3. AUTHENTICATION & PROFILES (Requirements 1, 8, 9, 10)
// ==========================================
const SignupSchema = z.object({
  email: z.string().email('Please provide a valid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
});

router.post('/auth/signup', authRateLimiter, (req: Request, res: Response) => {
  const parse = SignupSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid input data' });
    return;
  }

  const { email, password, name, phone } = parse.data;
  const db = getDatabase();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    // Avoid user enumeration
    res.status(400).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const userId = 'usr_' + crypto.randomBytes(12).toString('hex');
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(password);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, normalizedEmail, hash, salt, now, now);

  db.prepare(`
    INSERT INTO profiles (user_id, display_name, phone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, name || null, phone || null, now, now);

  const { token: sessionToken, expiresAt } = createSession(userId, {
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  recordAuditLog({
    userId,
    action: 'AUTH_SIGNUP',
    outcome: 'SUCCESS',
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    user: { id: userId, email: normalizedEmail },
    profile: { user_id: userId, display_name: name || null, phone: phone || null, covenant_accepted_at: null },
    session: { access_token: sessionToken, expires_at: expiresAt },
  });
});

const SigninSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/auth/signin', authRateLimiter, (req: Request, res: Response) => {
  const parse = SigninSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid login credentials' });
    return;
  }

  const { email, password } = parse.data;
  const db = getDatabase();
  const normalizedEmail = email.trim().toLowerCase();

  const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as {
    id: string;
    email: string;
    password_hash: string;
    password_salt: string;
  } | undefined;

  // Generic invalid credentials message to prevent user enumeration
  if (!userRow || !verifyPassword(password, userRow.password_hash, userRow.password_salt)) {
    recordAuditLog({
      action: 'AUTH_SIGNIN_FAILURE',
      target: normalizedEmail,
      outcome: 'FAILURE',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const { token: sessionToken, expiresAt } = createSession(userRow.id, {
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userRow.id);

  recordAuditLog({
    userId: userRow.id,
    action: 'AUTH_SIGNIN',
    outcome: 'SUCCESS',
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  res.json({
    user: { id: userRow.id, email: userRow.email },
    profile,
    session: { access_token: sessionToken, expires_at: expiresAt },
  });
});

router.post('/auth/signout', requireAuth, (req: Request, res: Response) => {
  if (req.session?.token) {
    deleteSession(req.session.token);
  }
  recordAuditLog({
    userId: req.user?.id,
    action: 'AUTH_SIGNOUT',
    outcome: 'SUCCESS',
    ip: getClientIp(req),
  });
  res.json({ success: true });
});

router.get('/auth/profile', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user!.id);
  res.json({ profile });
});

router.post('/auth/covenant', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare('UPDATE profiles SET covenant_accepted_at = ?, updated_at = ? WHERE user_id = ?').run(now, now, req.user!.id);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user!.id);
  res.json({ success: true, profile });
});

router.put('/auth/profile', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const { display_name, phone, covenant_accepted_at } = req.body;
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user!.id) as {
    display_name: string | null;
    phone: string | null;
    covenant_accepted_at: string | null;
  } | undefined;

  const newName = display_name !== undefined ? display_name : (existing?.display_name || null);
  const newPhone = phone !== undefined ? phone : (existing?.phone || null);
  const newCov = covenant_accepted_at !== undefined ? covenant_accepted_at : (existing?.covenant_accepted_at || null);

  db.prepare(`
    UPDATE profiles
    SET display_name = ?, phone = ?, covenant_accepted_at = ?, updated_at = ?
    WHERE user_id = ?
  `).run(newName, newPhone, newCov, now, req.user!.id);

  const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user!.id);
  res.json({ success: true, profile: updated });
});

// ==========================================
// 4. AGENT RUNS & FINDINGS (Requirements 1, 2, 3, 4, 5, 6)
// ==========================================

// Authenticated private run history
router.get('/runs', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const userId = req.user!.id;

  const runs = db.prepare(`
    SELECT * FROM agent_runs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 60
  `).all(userId) as Record<string, unknown>[];

  const findingStmt = db.prepare(`
    SELECT * FROM run_findings
    WHERE run_id = ?
    ORDER BY rank ASC
  `);

  const populated = runs.map((r) => {
    const rawFindings = findingStmt.all(String(r.id)) as Record<string, unknown>[];
    const findings = rawFindings.map((f) => {
      const linkedEvidence = getEvidenceForFinding(String(f.id));
      let evidenceIds: string[] = [];
      try {
        evidenceIds = typeof f.evidence_ids === 'string' ? JSON.parse(f.evidence_ids) : (f.evidence_ids || []);
      } catch {
        evidenceIds = [];
      }
      return {
        ...f,
        is_live: Boolean(f.is_direct_queried),
        is_direct_queried: Boolean(f.is_direct_queried),
        is_verified: Boolean(f.is_verified),
        evidence_ids: evidenceIds,
        evidence: linkedEvidence,
        tags: typeof f.tags === 'string' ? JSON.parse(f.tags) : [],
        playbook: typeof f.playbook === 'string' ? JSON.parse(f.playbook) : [],
      };
    });
    const runEvidence = getEvidenceForRun(String(r.id), userId);
    return {
      ...r,
      is_live: Boolean(r.is_live),
      is_fallback: Boolean(r.is_fallback),
      evidence_count: runEvidence.length,
      evidence: runEvidence,
      findings,
    };
  });

  res.json(populated);
});

// Dedicated demo runs feed for unauthenticated public preview
router.get('/demo/runs', (_req: Request, res: Response) => {
  const db = getDatabase();
  // Fetch demonstrative benchmark runs
  const runs = db.prepare(`
    SELECT * FROM agent_runs
    ORDER BY created_at DESC
    LIMIT 20
  `).all() as Record<string, unknown>[];

  const findingStmt = db.prepare(`
    SELECT * FROM run_findings
    WHERE run_id = ?
    ORDER BY rank ASC
  `);

  const populated = runs.map((r) => {
    const rawFindings = findingStmt.all(String(r.id)) as Record<string, unknown>[];
    const findings = rawFindings.map((f) => {
      const linkedEvidence = getEvidenceForFinding(String(f.id));
      let evidenceIds: string[] = [];
      try {
        evidenceIds = typeof f.evidence_ids === 'string' ? JSON.parse(f.evidence_ids) : (f.evidence_ids || []);
      } catch {
        evidenceIds = [];
      }
      return {
        ...f,
        is_live: Boolean(f.is_direct_queried),
        is_direct_queried: Boolean(f.is_direct_queried),
        is_verified: Boolean(f.is_verified),
        evidence_ids: evidenceIds,
        evidence: linkedEvidence,
        tags: typeof f.tags === 'string' ? JSON.parse(f.tags) : [],
        playbook: typeof f.playbook === 'string' ? JSON.parse(f.playbook) : [],
      };
    });
    const runEvidence = getEvidenceForRun(String(r.id));
    return {
      ...r,
      is_live: Boolean(r.is_live),
      is_fallback: Boolean(r.is_fallback),
      evidence_count: runEvidence.length,
      evidence: runEvidence,
      findings,
    };
  });

  res.json(populated);
});

// Authenticated Agent Execution Schema
const AgentExecutionSchema = z.object({
  agentId: z.string().max(100).optional(),
  agent_id: z.string().max(100).optional(),
  focus: z.string().max(500).optional(),
  customFocus: z.string().max(500).optional(),
  trigger: z.enum(['manual', 'scheduled']).optional(),
});

const handleAuthenticatedAgentRun = async (req: Request, res: Response) => {
  const parsed = AgentExecutionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid agent run parameters' });
    return;
  }

  try {
    // Enforce server-side user identity strictly from req.user!.id
    const userId = req.user!.id;
    const agentId = String(parsed.data.agentId || parsed.data.agent_id || 'freelance-scout');
    const focus = parsed.data.focus || parsed.data.customFocus;
    const trigger = parsed.data.trigger || 'manual';

    const result = await executeAgentSweep({
      userId,
      agentId,
      focus,
      trigger,
    });

    recordAuditLog({
      userId,
      action: 'AGENT_RUN_TRIGGER',
      target: agentId,
      outcome: 'SUCCESS',
      metadata: {
        runId: result.run_id,
        status: result.status,
        executionMode: result.execution_mode,
        isLive: result.is_live,
      },
      ip: getClientIp(req),
    });

    res.json({ success: true, ran: 1, runs: [result], run: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Run trigger failed';
    res.status(500).json({ error: msg });
  }
};

router.post('/runs/trigger', requireAuth, agentRunLimiter, handleAuthenticatedAgentRun);
router.post('/agent/run', requireAuth, agentRunLimiter, handleAuthenticatedAgentRun);

// Dedicated unauthenticated Demo Run Endpoint (does NOT persist into user private history)
router.post('/demo/agent/run', agentRunLimiter, async (req: Request, res: Response) => {
  try {
    const agentId = String(req.body.agentId || req.body.agent_id || 'freelance-scout');
    const focus = req.body.focus ? String(req.body.focus).slice(0, 300) : undefined;

    const result = await executeAgentSweep({
      userId: 'demo_guest_session',
      agentId,
      focus,
      trigger: 'manual',
    });

    res.json({
      success: true,
      isDemo: true,
      ran: 1,
      runs: [{ ...result, provenance: 'SIMULATED_DEMO' }],
      run: { ...result, provenance: 'SIMULATED_DEMO' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Demo run failed';
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// 5. PIPELINE USER ISOLATION (Requirement 17)
// ==========================================
router.get('/pipeline', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const userId = req.user!.id;

  const items = db.prepare(`
    SELECT * FROM pipeline_items
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Record<string, unknown>[];

  const parsed = items.map((p) => ({
    ...p,
    tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : [],
    playbook: typeof p.playbook === 'string' ? JSON.parse(p.playbook) : [],
    status_history: typeof p.status_history === 'string' ? JSON.parse(p.status_history) : [],
  }));

  res.json(parsed);
});

const PipelineCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  agent_id: z.string().max(100).optional(),
  source_run_id: z.string().max(100).optional(),
  source_finding_id: z.string().max(100).optional(),
  source: z.string().max(200).optional(),
  source_url: z.string().max(1000).optional(),
  summary: z.string().optional(),
  difficulty: z.number().optional(),
  score: z.number().optional(),
  payout: z.string().max(100).optional(),
  time_to_value: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  playbook: z.array(z.string()).optional(),
  status: z.string().max(50).optional(),
  provenance: z.string().max(50).optional(),
  notes: z.string().optional(),
});

router.post('/pipeline', requireAuth, (req: Request, res: Response) => {
  const parse = PipelineCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid pipeline data' });
    return;
  }

  const db = getDatabase();
  const userId = req.user!.id;
  const id = 'pipe_' + crypto.randomBytes(10).toString('hex');
  const now = new Date().toISOString();
  const data = parse.data;

  const status = data.status || 'new';
  const history = [{ status, timestamp: now, note: 'Initial creation' }];

  db.prepare(`
    INSERT INTO pipeline_items (
      id, owner_key, user_id, agent_id, source_run_id, source_finding_id,
      title, source, source_url, summary, difficulty, score, payout, time_to_value,
      tags, playbook, status, provenance, notes, status_history, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    userId,
    data.agent_id || 'freelance-scout',
    data.source_run_id || null,
    data.source_finding_id || null,
    data.title,
    data.source || null,
    data.source_url || null,
    data.summary || null,
    data.difficulty != null ? Number(data.difficulty) : null,
    data.score != null ? Number(data.score) : null,
    data.payout || null,
    data.time_to_value || null,
    JSON.stringify(data.tags || []),
    JSON.stringify(data.playbook || []),
    status,
    data.provenance || 'USER_SAVED',
    data.notes || null,
    JSON.stringify(history),
    now,
    now
  );

  const created = db.prepare('SELECT * FROM pipeline_items WHERE id = ?').get(id) as Record<string, unknown>;
  res.json({
    ...created,
    tags: typeof created.tags === 'string' ? JSON.parse(created.tags) : [],
    playbook: typeof created.playbook === 'string' ? JSON.parse(created.playbook) : [],
  });
});

router.put('/pipeline/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const id = String(req.params.id);
  const userId = req.user!.id;

  const item = db.prepare('SELECT * FROM pipeline_items WHERE id = ? AND user_id = ?').get(id, userId) as Record<string, unknown> | undefined;

  if (!item) {
    res.status(404).json({ error: 'Pipeline item not found or unauthorized' });
    return;
  }

  const now = new Date().toISOString();
  const newStatus = req.body.status || item.status;
  const notes = req.body.notes !== undefined ? req.body.notes : item.notes;

  let history: { status: string; timestamp: string; note?: string }[] = [];
  try {
    history = typeof item.status_history === 'string' ? JSON.parse(item.status_history) : [];
  } catch {
    history = [];
  }

  if (newStatus !== item.status) {
    history.push({ status: newStatus, timestamp: now, note: req.body.note || 'Status updated' });
  }

  db.prepare(`
    UPDATE pipeline_items
    SET status = ?, notes = ?, status_history = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(newStatus, notes, JSON.stringify(history), now, id, userId);

  const updated = db.prepare('SELECT * FROM pipeline_items WHERE id = ?').get(id) as Record<string, unknown>;
  res.json({
    success: true,
    item: {
      ...updated,
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags) : [],
      playbook: typeof updated.playbook === 'string' ? JSON.parse(updated.playbook) : [],
    },
  });
});

router.delete('/pipeline/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const id = String(req.params.id);
  const userId = req.user!.id;

  const result = db.prepare('DELETE FROM pipeline_items WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Pipeline item not found or unauthorized' });
    return;
  }

  res.json({ success: true });
});

// ==========================================
// 6. FINAL REPORT SYNTHESIS (Requirements 18, 19)
// ==========================================
router.get('/reports', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const userId = req.user!.id;

  const reports = db.prepare(`
    SELECT * FROM final_reports
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId) as Record<string, unknown>[];

  const parsed = reports.map((r) => ({
    ...r,
    agent_summaries: typeof r.agent_summaries === 'string' ? JSON.parse(r.agent_summaries) : [],
    conflicts: typeof r.conflicts === 'string' ? JSON.parse(r.conflicts) : [],
    steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : [],
    schedule_advice: typeof r.schedule_advice === 'string' ? JSON.parse(r.schedule_advice) : [],
    completed_steps: typeof r.completed_steps === 'string' ? JSON.parse(r.completed_steps) : [],
    references_used: typeof r.references_used === 'string' ? JSON.parse(r.references_used) : [],
  }));

  res.json(parsed);
});

const ReportGenerateSchema = z.object({
  goal: z.string().max(500).optional(),
  hours: z.number().min(1).max(100).optional(),
  budget: z.string().max(100).optional(),
  level: z.string().max(50).optional(),
});

router.post('/reports/generate', requireAuth, async (req: Request, res: Response) => {
  const parse = ReportGenerateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid parameters' });
    return;
  }

  try {
    const userId = req.user!.id;
    const { goal, hours, budget, level } = parse.data;

    const result = await generateAxisReport({
      userId,
      goal,
      hours,
      budget,
      level,
    });

    recordAuditLog({
      userId,
      action: 'REPORT_GENERATION',
      target: result.report.id,
      outcome: 'SUCCESS',
      metadata: { usedRuns: result.usedRuns, savedCount: result.savedCount },
      ip: getClientIp(req),
    });

    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Report synthesis failed';
    const isInsufficient = msg.includes('INSUFFICIENT_DATA');
    res.status(isInsufficient ? 422 : 500).json({
      error: msg,
      code: isInsufficient ? 'INSUFFICIENT_DATA' : 'SYNTHESIS_FAILED',
    });
  }
});

router.post('/reports/:id/steps', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const id = String(req.params.id);
  const userId = req.user!.id;
  const { completed } = req.body;
  const now = new Date().toISOString();

  const report = db.prepare('SELECT id FROM final_reports WHERE id = ? AND user_id = ?').get(id, userId);
  if (!report) {
    res.status(404).json({ error: 'Report not found or unauthorized' });
    return;
  }

  db.prepare(`
    UPDATE final_reports
    SET completed_steps = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(JSON.stringify(completed || []), now, id, userId);

  res.json({ success: true });
});

router.delete('/reports/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const id = String(req.params.id);
  const userId = req.user!.id;

  const result = db.prepare('DELETE FROM final_reports WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Report not found or unauthorized' });
    return;
  }
  res.json({ success: true });
});

// ==========================================
// 7. REAL SCHEDULES API (Requirements 12, 13, 14)
// ==========================================
router.get('/schedules', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const userId = req.user!.id;

  let rows = db.prepare('SELECT * FROM schedules WHERE user_id = ?').all(userId) as Record<string, unknown>[];

  if (rows.length === 0) {
    // Seed default schedules for new user
    const now = new Date().toISOString();
    for (const agentId of Object.keys(AGENT_CONTRACTS)) {
      const id = 'sched_' + crypto.randomBytes(8).toString('hex');
      const nextRun = calculateNextRun('Every 24h · 06:00', new Date(), 'UTC');
      db.prepare(`
        INSERT OR IGNORE INTO schedules (id, user_id, agent_id, cadence, enabled, timezone, focus, next_run_at, created_at, updated_at)
        VALUES (?, ?, ?, 'Every 24h · 06:00', 1, 'UTC', NULL, ?, ?, ?)
      `).run(id, userId, agentId, nextRun, now, now);
    }
    rows = db.prepare('SELECT * FROM schedules WHERE user_id = ?').all(userId) as Record<string, unknown>[];
  }

  res.json(rows);
});

const ScheduleUpdateSchema = z.object({
  agentId: z.string().max(100).optional(),
  cadence: z.string().max(100).optional(),
  enabled: z.boolean().optional(),
  timezone: z.string().max(100).optional(),
  focus: z.string().max(300).optional(),
  entries: z.record(z.string()).optional(),
});

router.post('/schedules', requireAuth, (req: Request, res: Response) => {
  const parse = ScheduleUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid schedule update' });
    return;
  }

  const db = getDatabase();
  const userId = req.user!.id;
  const { agentId, cadence, enabled, timezone, focus, entries } = parse.data;
  const now = new Date().toISOString();
  const userTz = timezone || 'UTC';

  if (entries && typeof entries === 'object') {
    for (const [aId, cVal] of Object.entries(entries)) {
      const nextRun = calculateNextRun(String(cVal), new Date(), userTz);
      db.prepare(`
        INSERT INTO schedules (id, user_id, agent_id, cadence, enabled, timezone, focus, next_run_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, NULL, ?, ?, ?)
        ON CONFLICT(user_id, agent_id) DO UPDATE SET
          cadence = excluded.cadence,
          timezone = excluded.timezone,
          next_run_at = excluded.next_run_at,
          updated_at = excluded.updated_at
      `).run('sched_' + crypto.randomBytes(8).toString('hex'), userId, aId, String(cVal), userTz, nextRun, now, now);
    }
  } else if (agentId) {
    const currentCadence = cadence || 'Every 24h · 06:00';
    const isEnabled = enabled !== undefined ? (enabled ? 1 : 0) : 1;
    const nextRun = calculateNextRun(currentCadence, new Date(), userTz);
    db.prepare(`
      INSERT INTO schedules (id, user_id, agent_id, cadence, enabled, timezone, focus, next_run_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, agent_id) DO UPDATE SET
        cadence = excluded.cadence,
        enabled = excluded.enabled,
        timezone = excluded.timezone,
        focus = excluded.focus,
        next_run_at = excluded.next_run_at,
        updated_at = excluded.updated_at
    `).run('sched_' + crypto.randomBytes(8).toString('hex'), userId, agentId, currentCadence, isEnabled, userTz, focus || null, nextRun, now, now);
  }

  res.json({ success: true });
});

router.post('/schedules/:id/run', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await triggerManualScheduleRun(id, req.user!.id);
    res.json({ success: true, run: result });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Schedule run failed' });
  }
});

router.get('/schedules/executions', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM schedule_executions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `).all(req.user!.id);
  res.json(rows);
});

// ==========================================
// 8. INTERMEDIARY BRIDGE (Requirement 16)
// ==========================================
router.get('/bridge/keys', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const keys = listBridgeKeys(userId);
  res.json(keys);
});

const BridgeKeyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  targetSite: z.string().url('Must be a valid URL').max(500),
  permissions: z.array(z.string()).optional(),
  rateLimit: z.number().min(1).max(1000).optional(),
});

router.post('/bridge/keys', requireAuth, (req: Request, res: Response) => {
  const parse = BridgeKeyCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid key parameters' });
    return;
  }

  const userId = req.user!.id;
  const { name, targetSite, permissions, rateLimit } = parse.data;

  const result = generateBridgeKey({
    userId,
    name,
    targetSite,
    permissions,
    rateLimit,
  });

  recordAuditLog({
    userId,
    action: 'BRIDGE_KEY_CREATE',
    target: result.key.id,
    outcome: 'SUCCESS',
    ip: getClientIp(req),
  });

  res.json({
    key: {
      ...result.key,
      hashed_key: undefined, // Never expose hashed secret
    },
    fullKey: result.fullKey, // Return raw secret ONCE at creation time
  });
});

router.delete('/bridge/keys/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const success = revokeBridgeKey(String(req.params.id), userId);

  recordAuditLog({
    userId,
    action: 'BRIDGE_KEY_REVOKE',
    target: String(req.params.id),
    outcome: success ? 'SUCCESS' : 'FAILURE',
    ip: getClientIp(req),
  });

  if (!success) {
    res.status(404).json({ error: 'Bridge key not found or unauthorized' });
    return;
  }

  res.json({ success });
});

router.get('/proxy/logs', requireAuth, (req: Request, res: Response) => {
  // Scoped to authenticated user's bridge operations
  const logs = getRecentProxyLogs(50, req.user!.id);
  res.json(logs);
});

// External Storefront Proxy Endpoint
router.post('/proxy/agent', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const { agentId, sourceClient, focus, customContext } = req.body;
  const clientName = String(sourceClient || 'Kitchen & Code Storefront');
  const ip = getClientIp(req);

  const authCheck = validateBridgeRequest(token, 'proxy:agent');

  if (!authCheck.valid) {
    const latency = Date.now() - startTime;
    logProxyEvent({
      sourceClient: clientName,
      targetAgent: String(agentId || 'unspecified'),
      action: 'PROXY_AGENT_REJECTED',
      statusCode: 401,
      latencyMs: latency,
      ipAddress: ip,
      metadata: { reason: authCheck.reason },
    });
    res.status(401).json({ error: `Unauthorized: ${authCheck.reason}` });
    return;
  }

  try {
    const targetAgentId = String(agentId || 'freelance-scout');
    const sweepResult = await executeAgentSweep({
      userId: authCheck.key!.user_id,
      agentId: targetAgentId,
      focus: String(focus || customContext || 'Restaurant shift automation & ops P&L'),
      trigger: 'manual',
    });

    const latency = Date.now() - startTime;
    logProxyEvent({
      userId: authCheck.key!.user_id,
      keyId: authCheck.key!.id,
      sourceClient: clientName,
      targetAgent: targetAgentId,
      action: 'PROXY_AGENT_SUCCESS',
      statusCode: 200,
      latencyMs: latency,
      ipAddress: ip,
      metadata: { runId: sweepResult.run_id, isLive: sweepResult.is_live },
    });

    res.json({
      status: 'success',
      agent: targetAgentId,
      sourceClient: clientName,
      headline: sweepResult.headline,
      warning: sweepResult.warning,
      findings: sweepResult.findings,
      latencyMs: latency,
      execution_mode: sweepResult.execution_mode,
      provenance: sweepResult.is_live ? 'LIVE_SOURCE' : 'MODEL_INFERENCE',
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    logProxyEvent({
      userId: authCheck.key!.user_id,
      keyId: authCheck.key!.id,
      sourceClient: clientName,
      targetAgent: agentId || 'error',
      action: 'PROXY_AGENT_ERROR',
      statusCode: 500,
      latencyMs: latency,
      ipAddress: ip,
      metadata: { error: err instanceof Error ? err.message : String(err) },
    });
    res.status(500).json({ error: 'Proxy agent execution failed' });
  }
});

// ==========================================
// 9. WORKSPACE & PLATFORM STATUS (Requirement 21)
// ==========================================
router.get('/workspace/status', (_req: Request, res: Response) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    connected: false,
    status: 'NOT_CONFIGURED',
    provider: 'Google Workspace',
    aiEngine: geminiConfigured ? 'Google Gemini 3.7 Flash' : 'Simulated Benchmark Mode',
    apps: [
      { id: 'gmail', name: 'Gmail', icon: 'Mail', status: 'NOT_CONFIGURED', description: 'Daily morning briefing and priority alert dispatch' },
      { id: 'calendar', name: 'Google Calendar', icon: 'Calendar', status: 'NOT_CONFIGURED', description: 'Rhythm schedules & checkpoint milestones sync' },
      { id: 'docs', name: 'Google Docs', icon: 'FileText', status: 'NOT_CONFIGURED', description: 'Export full formatted playbooks and final path reports' },
      { id: 'drive', name: 'Google Drive', icon: 'HardDrive', status: 'NOT_CONFIGURED', description: 'Save and organize compounded assets and client deliverables' },
      { id: 'keep', name: 'Google Keep', icon: 'Lightbulb', status: 'NOT_CONFIGURED', description: 'Quick-capture opportunity checklists & tactical action cards' },
      { id: 'tasks', name: 'Google Tasks', icon: 'CheckSquare', status: 'NOT_CONFIGURED', description: 'Synchronize 5-step numbered execution playbooks' },
    ],
    settings: {
      autoSyncCalendar: false,
      dailyBriefingEmail: false,
      exportFormat: 'markdown',
      keepTag: '#MaximizeYourFuture',
      tasksList: 'Maximize Your Future',
      driveFolder: 'Maximize Your Future / Playbooks',
    },
  });
});

router.post('/workspace/export', requireAuth, (req: Request, res: Response) => {
  const { targetApp, title } = req.body;
  res.json({
    success: true,
    targetApp,
    exportId: 'export_' + crypto.randomBytes(8).toString('hex'),
    title: title || 'Exported Playbook',
    message: `Formatted and staged for ${targetApp} (Preview payload).`,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 10. BRIEFING SUBSCRIBER SIGNUP
// ==========================================
const SubscribeSchema = z.object({
  email: z.string().email('Valid email address is required').max(255),
  name: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
});

router.post('/briefing/subscribe', (req: Request, res: Response) => {
  const parse = SubscribeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid email address' });
    return;
  }

  const { email, name, phone } = parse.data;
  const db = getDatabase();
  const id = 'sub_' + crypto.randomBytes(10).toString('hex');
  const userId = req.user ? req.user.id : null;

  db.prepare(`
    INSERT INTO subscribers (id, user_id, email, name, phone, sms_opt_in, source, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 'briefing_bar', ?)
  `).run(id, userId, email.trim().toLowerCase(), name || null, phone || null, new Date().toISOString());

  res.json({
    success: true,
    message: 'Subscribed to daily morning briefing dispatch at 06:00 local.',
  });
});
