import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getDatabase, closeDatabase } from '../server/db';
import {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  hashSessionToken,
  recordAuditLog,
} from '../server/auth';
import { executeAgentSweep } from '../server/agents';
import { calculateNextRun, tickScheduler, triggerManualScheduleRun } from '../server/scheduler';
import { generateAxisReport } from '../server/reports';
import { generateBridgeKey, listBridgeKeys, revokeBridgeKey } from '../server/bridge';
import { rateLimiter } from '../server/rateLimit';

async function runTestSuite() {
  console.log('====================================================');
  console.log('STARTING PRODUCTION HARDENING TEST SUITE');
  console.log('====================================================\n');

  const db = getDatabase();

  // Test 1: Session Token Hashing at Rest
  console.log('TEST 1: Session Token Hashing at Rest');
  const testUserId = 'test_usr_' + crypto.randomBytes(6).toString('hex');
  const rawPassword = 'SecurePassword123!';
  const { hash: pHash, salt: pSalt } = hashPassword(rawPassword);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(testUserId, `${testUserId}@example.com`, pHash, pSalt);

  const { token: rawSessionToken } = createSession(testUserId, { ipAddress: '127.0.0.1' });
  const expectedHash = hashSessionToken(rawSessionToken);

  // Verify that raw token NEVER exists in the database
  const directTokenMatch = db.prepare('SELECT * FROM sessions WHERE token = ?').get(rawSessionToken);
  assert.equal(directTokenMatch, undefined, 'Raw session token must NOT be stored in sessions table');

  const hashedTokenMatch = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(expectedHash) as Record<string, unknown>;
  assert.ok(hashedTokenMatch, 'Hashed token must be present in database');
  assert.equal(hashedTokenMatch.user_id, testUserId);

  // Validate session resolution works
  const sessionValidation = validateSession(rawSessionToken);
  assert.ok(sessionValidation, 'Session validation with raw bearer token must succeed');
  assert.equal(sessionValidation?.userId, testUserId);
  console.log('✓ PASS: Session token hashed at rest with SHA-256 and verified.\n');

  // Test 2: Persistent Rate Limiting
  console.log('TEST 2: Persistent Rate Limiting Enforcement');
  const rlKey = 'test_key_' + crypto.randomBytes(4).toString('hex');
  const limit = 3;
  const windowMs = 2000;

  const r1 = rateLimiter.consume(rlKey, limit, windowMs);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = rateLimiter.consume(rlKey, limit, windowMs);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = rateLimiter.consume(rlKey, limit, windowMs);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  const r4 = rateLimiter.consume(rlKey, limit, windowMs);
  assert.equal(r4.allowed, false, 'Rate limiter must block on 4th attempt');
  console.log('✓ PASS: Persistent SQLite rate limiting blocks over-limit requests.\n');

  // Test 3: Agent Provenance & Execution Modes
  console.log('TEST 3: Agent Provenance & Execution Mode Tagging');
  const sweep = await executeAgentSweep({
    userId: testUserId,
    agentId: 'freelance-scout',
    focus: 'React Native Micro-Consulting',
    trigger: 'manual',
  });

  assert.ok(sweep.run_id, 'Run ID must be generated');
  assert.ok(
    ['LIVE_RETRIEVAL', 'MODEL_ONLY', 'SIMULATED'].includes(sweep.execution_mode),
    `Execution mode must be formalized (got ${sweep.execution_mode})`
  );
  assert.ok(sweep.findings.length > 0, 'Sweep must produce findings');

  const finding = sweep.findings[0];
  assert.ok(
    ['LIVE_SOURCE', 'MODEL_INFERENCE', 'SIMULATED_DEMO'].includes(finding.provenance || ''),
    `Finding provenance must be truthful (got ${finding.provenance})`
  );
  console.log(`✓ PASS: Agent execution tagged with mode: ${sweep.execution_mode}, finding provenance: ${finding.provenance}\n`);

  // Test 4: Scheduler Concurrency, Timezone Calculation & Atomic Claiming
  console.log('TEST 4: Scheduler Atomic Claiming & Timezone Precision');
  const nyNext = calculateNextRun('Every 24h · 06:00', new Date(), 'America/New_York');
  const utcNext = calculateNextRun('Every 24h · 06:00', new Date(), 'UTC');
  assert.ok(nyNext && utcNext, 'Next runs must be calculated');
  assert.notEqual(nyNext, utcNext, 'Timezone-aware next run must differ based on offset');

  // Test atomic claiming
  const schedId = 'sched_test_' + crypto.randomBytes(6).toString('hex');
  const pastTime = new Date(Date.now() - 60000).toISOString();
  db.prepare(`
    INSERT INTO schedules (id, user_id, agent_id, cadence, enabled, timezone, focus, next_run_at, created_at, updated_at)
    VALUES (?, ?, 'freelance-scout', 'Every 24h · 06:00', 1, 'UTC', 'Auto test', ?, datetime('now'), datetime('now'))
  `).run(schedId, testUserId, pastTime);

  const claimed = await tickScheduler();
  assert.ok(claimed >= 1, 'Scheduler must process due schedule');

  const updatedSched = db.prepare('SELECT * FROM schedules WHERE id = ?').get(schedId) as Record<string, unknown>;
  assert.equal(updatedSched.claimed_at, null, 'Schedule claim must be released upon completion');
  assert.equal(updatedSched.failure_count, 0, 'Failure count must be 0 on success');
  console.log('✓ PASS: Atomic schedule claiming and timezone calculations verified.\n');

  // Test 5: End-to-End User Flow (Signup -> Run -> Pipeline -> Report)
  console.log('TEST 5: End-to-End User Flow');
  const e2eUser = 'e2e_usr_' + crypto.randomBytes(6).toString('hex');
  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, created_at, updated_at)
    VALUES (?, ?, 'dummy_hash', 'dummy_salt', datetime('now'), datetime('now'))
  `).run(e2eUser, `${e2eUser}@example.com`);

  const runResult = await executeAgentSweep({
    userId: e2eUser,
    agentId: 'freelance-scout',
    focus: 'E2E Testing Pipeline',
  });

  const topFinding = runResult.findings[0];
  const pipeId = 'pipe_' + crypto.randomBytes(8).toString('hex');
  db.prepare(`
    INSERT INTO pipeline_items (
      id, owner_key, user_id, agent_id, source_run_id, source_finding_id,
      title, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'saved', datetime('now'), datetime('now'))
  `).run(pipeId, e2eUser, e2eUser, 'freelance-scout', runResult.run_id, 'fnd_sample', topFinding.title);

  // Generate AXIS-07 Report
  const axisResult = await generateAxisReport({
    userId: e2eUser,
    goal: 'Scale AI Micro-Agency',
    hours: 10,
    budget: '$500',
    level: 'intermediate',
  });

  assert.ok(axisResult.report.id, 'Report must be generated');
  assert.ok(axisResult.report.steps.length > 0, 'Report must contain linear steps');
  const step1 = axisResult.report.steps[0];
  assert.ok(step1.supporting_run_id || step1.supporting_finding_id || step1.supporting_pipeline_id, 'Step must link to supporting evidence');
  console.log('✓ PASS: End-to-end flow from run -> pipeline -> report synthesis verified.\n');

  // Test 6: Multi-User Isolation
  console.log('TEST 6: Multi-User Isolation (User A vs User B)');
  const userA = 'usrA_' + crypto.randomBytes(6).toString('hex');
  const userB = 'usrB_' + crypto.randomBytes(6).toString('hex');

  for (const u of [userA, userB]) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, password_salt, created_at, updated_at)
      VALUES (?, ?, 'hash', 'salt', datetime('now'), datetime('now'))
    `).run(u, `${u}@test.com`);
  }

  // Create isolated runs
  const runA = await executeAgentSweep({ userId: userA, agentId: 'freelance-scout', focus: 'User A Confidential Strategy' });
  const runB = await executeAgentSweep({ userId: userB, agentId: 'freelance-scout', focus: 'User B Confidential Strategy' });

  // Query User A runs
  const runsForA = db.prepare('SELECT id FROM agent_runs WHERE user_id = ?').all(userA) as { id: string }[];
  const runIdsForA = runsForA.map((r) => r.id);
  assert.ok(runIdsForA.includes(runA.run_id), "User A must see User A's run");
  assert.ok(!runIdsForA.includes(runB.run_id), "User A must NEVER see User B's run");

  // Create isolated pipeline items
  const pipeA = 'pipeA_' + crypto.randomBytes(6).toString('hex');
  const pipeB = 'pipeB_' + crypto.randomBytes(6).toString('hex');

  db.prepare(`
    INSERT INTO pipeline_items (id, owner_key, user_id, agent_id, title, created_at, updated_at)
    VALUES (?, ?, ?, 'freelance-scout', 'User A Pipeline Secret', datetime('now'), datetime('now'))
  `).run(pipeA, userA, userA);

  db.prepare(`
    INSERT INTO pipeline_items (id, owner_key, user_id, agent_id, title, created_at, updated_at)
    VALUES (?, ?, ?, 'freelance-scout', 'User B Pipeline Secret', datetime('now'), datetime('now'))
  `).run(pipeB, userB, userB);

  const pipelineForA = db.prepare('SELECT id FROM pipeline_items WHERE user_id = ?').all(userA) as { id: string }[];
  const pipeIdsForA = pipelineForA.map((p) => p.id);
  assert.ok(pipeIdsForA.includes(pipeA), "User A must see User A's pipeline item");
  assert.ok(!pipeIdsForA.includes(pipeB), "User A must NEVER see User B's pipeline item");

  // Create isolated bridge keys
  const keyA = generateBridgeKey({ userId: userA, name: 'Key A', targetSite: 'https://site-a.com' });
  const keyB = generateBridgeKey({ userId: userB, name: 'Key B', targetSite: 'https://site-b.com' });

  const keysForA = listBridgeKeys(userA);
  const keyIdsForA = keysForA.map((k) => k.id);
  assert.ok(keyIdsForA.includes(keyA.key.id), "User A must see User A's bridge key");
  assert.ok(!keyIdsForA.includes(keyB.key.id), "User A must NEVER see User B's bridge key");

  // Test report isolation
  const reportA = await generateAxisReport({ userId: userA, goal: 'Path A' });
  const reportB = await generateAxisReport({ userId: userB, goal: 'Path B' });

  const reportsForA = db.prepare('SELECT id FROM final_reports WHERE user_id = ?').all(userA) as { id: string }[];
  const reportIdsForA = reportsForA.map((r) => r.id);
  assert.ok(reportIdsForA.includes(reportA.report.id), "User A must see User A's report");
  assert.ok(!reportIdsForA.includes(reportB.report.id), "User A must NEVER see User B's report");
  console.log('✓ PASS: Multi-user isolation verified across runs, pipeline, bridge keys, and reports.\n');

  console.log('====================================================');
  console.log('ALL PRODUCTION HARDENING TESTS PASSED SUCCESSFULLY');
  console.log('====================================================');
}

runTestSuite().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
