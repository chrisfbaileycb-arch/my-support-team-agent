import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// Configurable database path with auto-directory creation
const dbFilePath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'myf.sqlite');
const dataDir = path.dirname(dbFilePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbFilePath);
    // Enable WAL mode for optimal concurrent reads and writes, and foreign keys
    dbInstance.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
    `);
    runMigrations(dbInstance);
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}

function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
  const applied = new Set(appliedRows.map((r) => r.name));

  const migrations: { name: string; sql: string }[] = [
    {
      name: '001_core_schema',
      sql: `
        -- Users & Authentication
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          display_name TEXT,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'member',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

        -- Profiles
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          email TEXT,
          display_name TEXT,
          phone TEXT,
          covenant_accepted_at TEXT,
          tier TEXT NOT NULL DEFAULT 'community',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

        -- Sessions
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

        -- Agent Runs
        CREATE TABLE IF NOT EXISTS agent_runs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          codename TEXT NOT NULL,
          trigger TEXT NOT NULL DEFAULT 'manual',
          status TEXT NOT NULL DEFAULT 'complete',
          headline TEXT,
          warning TEXT,
          error TEXT,
          model TEXT,
          provider TEXT,
          latency_ms INTEGER NOT NULL DEFAULT 0,
          source_count INTEGER NOT NULL DEFAULT 0,
          findings_count INTEGER NOT NULL DEFAULT 0,
          is_live INTEGER NOT NULL DEFAULT 0,
          is_fallback INTEGER NOT NULL DEFAULT 0,
          requested_focus TEXT,
          started_at TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON agent_runs(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id);

        -- Run Findings
        CREATE TABLE IF NOT EXISTS run_findings (
          id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          rank INTEGER NOT NULL DEFAULT 1,
          title TEXT NOT NULL,
          source_name TEXT NOT NULL,
          source_url TEXT NOT NULL,
          source_type TEXT NOT NULL DEFAULT 'marketplace_search',
          retrieved_at TEXT NOT NULL,
          excerpt TEXT,
          confidence REAL NOT NULL DEFAULT 0.85,
          is_direct_queried INTEGER NOT NULL DEFAULT 0,
          provenance TEXT NOT NULL DEFAULT 'MODEL INFERENCE',
          summary TEXT,
          difficulty INTEGER NOT NULL DEFAULT 5,
          score INTEGER NOT NULL DEFAULT 75,
          payout TEXT,
          time_to_value TEXT,
          tags TEXT NOT NULL DEFAULT '[]',
          playbook TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_run_findings_run ON run_findings(run_id);
        CREATE INDEX IF NOT EXISTS idx_run_findings_user ON run_findings(user_id);

        -- Pipeline Items
        CREATE TABLE IF NOT EXISTS pipeline_items (
          id TEXT PRIMARY KEY,
          owner_key TEXT,
          user_id TEXT,
          agent_id TEXT NOT NULL,
          source_run_id TEXT,
          source_finding_id TEXT,
          title TEXT NOT NULL,
          source TEXT,
          source_url TEXT,
          summary TEXT,
          difficulty INTEGER,
          score INTEGER,
          payout TEXT,
          time_to_value TEXT,
          tags TEXT NOT NULL DEFAULT '[]',
          playbook TEXT NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'new',
          provenance TEXT NOT NULL DEFAULT 'USER_SAVED',
          notes TEXT,
          status_history TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_pipeline_user ON pipeline_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_pipeline_owner ON pipeline_items(owner_key);
        CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_items(status);

        -- Final Reports
        CREATE TABLE IF NOT EXISTS final_reports (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT,
          agent_summaries TEXT NOT NULL DEFAULT '[]',
          conflicts TEXT NOT NULL DEFAULT '[]',
          steps TEXT NOT NULL DEFAULT '[]',
          schedule_advice TEXT NOT NULL DEFAULT '[]',
          next_24h TEXT,
          completed_steps TEXT NOT NULL DEFAULT '[]',
          references_used TEXT NOT NULL DEFAULT '[]',
          provenance TEXT NOT NULL DEFAULT 'MODEL_SYNTHESIS',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reports_user ON final_reports(user_id, created_at DESC);

        -- Schedules
        CREATE TABLE IF NOT EXISTS schedules (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          cadence TEXT NOT NULL DEFAULT 'Every 24h · 06:00',
          enabled INTEGER NOT NULL DEFAULT 1,
          timezone TEXT NOT NULL DEFAULT 'UTC',
          focus TEXT,
          next_run_at TEXT NOT NULL,
          last_run_at TEXT,
          failure_count INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(user_id, agent_id)
        );
        CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
        CREATE INDEX IF NOT EXISTS idx_schedules_next ON schedules(enabled, next_run_at);

        -- Schedule Executions
        CREATE TABLE IF NOT EXISTS schedule_executions (
          id TEXT PRIMARY KEY,
          schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          run_id TEXT,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          status TEXT NOT NULL DEFAULT 'running',
          error TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_schedule_exec ON schedule_executions(schedule_id, created_at DESC);

        -- Bridge API Keys
        CREATE TABLE IF NOT EXISTS bridge_api_keys (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          key_prefix TEXT NOT NULL,
          hashed_key TEXT NOT NULL UNIQUE,
          target_site TEXT NOT NULL,
          permissions TEXT NOT NULL DEFAULT '[]',
          rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
          last_used_at TEXT,
          revoked_at TEXT,
          expires_at TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_bridge_keys_hashed ON bridge_api_keys(hashed_key);

        -- Proxy Logs
        CREATE TABLE IF NOT EXISTS proxy_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          key_id TEXT,
          source_client TEXT NOT NULL,
          target_agent TEXT NOT NULL,
          action TEXT NOT NULL,
          status_code INTEGER NOT NULL,
          latency_ms INTEGER NOT NULL,
          ip_address TEXT,
          timestamp TEXT NOT NULL,
          metadata TEXT NOT NULL DEFAULT '{}'
        );
        CREATE INDEX IF NOT EXISTS idx_proxy_logs_time ON proxy_logs(timestamp DESC);

        -- Subscribers (Morning Briefing)
        CREATE TABLE IF NOT EXISTS subscribers (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          email TEXT NOT NULL,
          name TEXT,
          phone TEXT,
          sms_opt_in INTEGER NOT NULL DEFAULT 0,
          source TEXT NOT NULL DEFAULT 'briefing_bar',
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

        -- Audit Logs
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT NOT NULL,
          target TEXT,
          outcome TEXT NOT NULL,
          request_id TEXT,
          ip TEXT,
          user_agent TEXT,
          metadata TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at DESC);

        -- Workspace Settings
        CREATE TABLE IF NOT EXISTS workspace_settings (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          settings_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        -- Subscriptions
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          plan TEXT NOT NULL DEFAULT 'community',
          status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
          current_period_end TEXT,
          cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `,
    },
    {
      name: '002_default_seed_schedules',
      sql: `
        -- Insert default global schedule templates if empty
        INSERT OR IGNORE INTO workspace_settings (id, user_id, settings_json, updated_at)
        VALUES ('ws_default', 'default', '{"autoSyncCalendar":false,"dailyBriefingEmail":false,"exportFormat":"markdown","keepTag":"#MaximizeYourFuture","tasksList":"Maximize Your Future","driveFolder":"Maximize Your Future / Playbooks","connected":false,"status":"NOT_CONFIGURED"}', datetime('now'));
      `,
    },
    {
      name: '003_production_hardening',
      sql: `
        -- Persistent Rate Limit Buckets
        CREATE TABLE IF NOT EXISTS rate_limit_buckets (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0,
          reset_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_rate_limit_reset ON rate_limit_buckets(reset_at);

        -- Source Retrievals (Traceable evidence for live connectors)
        CREATE TABLE IF NOT EXISTS source_retrievals (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          query TEXT NOT NULL,
          url TEXT,
          excerpt TEXT,
          evidence_type TEXT NOT NULL,
          response_id TEXT,
          confidence REAL NOT NULL,
          retrieved_at TEXT NOT NULL,
          raw_payload TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_source_retrieval_agent ON source_retrievals(agent_id, retrieved_at DESC);
      `,
    },
  ];

  for (const migration of migrations) {
    if (!applied.has(migration.name)) {
      db.exec(migration.sql);
      const stmt = db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)');
      stmt.run(migration.name, new Date().toISOString());
    }
  }

  // Ensure columns exist on tables that may have been created in 001
  ensureColumn(db, 'sessions', 'token_hash', 'TEXT');
  ensureColumn(db, 'sessions', 'issued_at', 'TEXT');
  ensureColumn(db, 'sessions', 'last_used_at', 'TEXT');
  ensureColumn(db, 'sessions', 'revoked_at', 'TEXT');
  ensureColumn(db, 'sessions', 'device_label', 'TEXT');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);');

  ensureColumn(db, 'schedules', 'claimed_at', 'TEXT');
  ensureColumn(db, 'schedules', 'claimed_by', 'TEXT');
  ensureColumn(db, 'schedules', 'lease_expires_at', 'TEXT');
  ensureColumn(db, 'schedules', 'retry_count', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'schedules', 'execution_state', "TEXT NOT NULL DEFAULT 'IDLE'");

  ensureColumn(db, 'agent_runs', 'execution_mode', "TEXT NOT NULL DEFAULT 'MODEL_ONLY'");

  ensureColumn(db, 'run_findings', 'evidence_type', 'TEXT');
  ensureColumn(db, 'run_findings', 'response_id', 'TEXT');
}

function ensureColumn(db: DatabaseSync, table: string, column: string, typeDef: string): void {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    const exists = cols.some((c) => c.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
    }
  } catch (err) {
    console.warn(`Failed to verify or add column ${column} on ${table}:`, err);
  }
}
