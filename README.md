# Maximize Your Future (My Support Team Agent)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.7_Flash-4285F4.svg)](https://ai.google.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57.svg)](https://www.sqlite.org/)

> **An autonomous 7-agent AI intelligence platform and compounding pipeline.**  
> Seven specialist agents continuously sweep marketplaces, zero-ship commerce catalogs, weak trend signals, competitive benchmarks, free growth channels, and platform skill formats — synthesizing findings into one actionable, step-by-step income path.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Philosophy & Ethical Guardrails](#core-philosophy--ethical-guardrails)
3. [The 7 Specialist Agents](#the-7-specialist-agents)
4. [Architecture & Workflow Breakdown](#architecture--workflow-breakdown)
   - [Agent Ingest & Sweep Flow](#1-agent-ingest--sweep-flow)
   - [Synthesis Engine & Path Generation](#2-synthesis-engine--path-generation)
   - [Pipeline Funnel & Kanban](#3-pipeline-funnel--kanban)
   - [Intermediary Bridge & Proxy Gateway](#4-intermediary-bridge--proxy-gateway)
5. [Database Schema & Data Persistence](#database-schema--data-persistence)
6. [Step-by-Step Operator Guide](#step-by-step-operator-guide)
7. [API Specification & Endpoints](#api-specification--endpoints)
8. [Installation & Setup](#installation--setup)
9. [Build & Deployment Guide](#build--deployment-guide)
10. [Security & Telemetry Audit](#security--telemetry-audit)

---

## System Overview

**Maximize Your Future** is engineered to eliminate noise, decision fatigue, and over-complicated setups for solo builders and modern operators. Instead of forcing you to browse dozens of disparate job boards, trend trackers, supplier feeds, and social platforms, seven autonomous agents execute targeted sweeps on scheduled cadences:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 OPERATOR DASHBOARD                      │
                  └───────────┬─────────────────────────────────┬───────────┘
                              │                                 │
              [Trigger Sweeps / Custom Focus]         [Manage Pipeline Funnel]
                              ▼                                 │
  ┌────────────────────────────────────────────────────────┐    │
  │                  7 SPECIALIST AGENTS                   │    │
  │                                                        │    │
  │  [SCOUT-01] Freelance Work Scout                       │    │
  │  [SCOUT-02] Zero-Ship Product Scout                    │    │
  │  [RADAR-03] Trend & Weak-Signal Radar                  │    │
  │  [ANALYST-04] Top-5 Benchmark Analyst                  │    │
  │  [GROWTH-05] Free-Channel Growth Strategist            │    │
  │  [FORGE-06] Skill Compounder & Platform Cartographer   │    │
  └───────────────────────────┬────────────────────────────┘    │
                              │ Raw Findings & Playbooks        │
                              ▼                                 │
  ┌────────────────────────────────────────────────────────┐    │
  │            AXIS-07 (Chief of Staff Synthesis)          │    │
  │  * Resolves cross-agent conflicts                      │    │
  │  * Calculates Payoff ÷ Effort against user limits      │    │
  │  * Emits 14-Day Linear Path + Kill-Criteria            │    │
  └───────────────────────────┬────────────────────────────┘    │
                              │ Synthesized Path & Checkpoints  │
                              ▼                                 ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                        LOCAL-FIRST PERSISTENCE                          │
  │       SQLite DB (WAL Mode) + Auth Sessions + Audit Logs                 │
  └───────────────────────────┬─────────────────────────────────────────────┘
                              │
  ┌───────────────────────────┴─────────────────────────────────────────────┐
  │                 INTERMEDIARY BRIDGE & PROXY GATEWAY                     │
  │   External Clients (e.g. Kitchen&Code) ──Bearer Auth──> /api/proxy/agent│
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Philosophy & Ethical Guardrails

Every agent adheres strictly to four fundamental operating principles:

1. **Report, Never Act**:
   Agents surface opportunities, verify margins, and write execution playbooks. They **never** submit bids, auto-apply to listings, message prospective clients, or place inventory orders without human command. The operator remains entirely in control.
2. **Fresh or Discarded**:
   Marketplace data and trend signals are evaluated against strict freshness criteria (< 24h). Stale data is discarded to protect the operator from pursuing saturated opportunities.
3. **Gated by Default (Least-Privilege Helpers)**:
   When compound agents (such as FORGE-06) spawn secondary helper assistants to draft schemas or merge workflows, helpers start with **zero standing permissions** (no network access, no tool invocation, no persistent storage) and terminate immediately upon task completion.
4. **Community Covenant & Respect**:
   Operators sign a Community Covenant committing to ethical use, genuine value creation, and transparent client communication.

---

## The 7 Specialist Agents

| Codename | Name | Mission & Focus | Cadence | Core Scan Targets | Primary Outputs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SCOUT-01** | Freelance Work Scout | Discovers high-demand freelance gigs solvable by a solo operator using AI tools. Filters for learnability and low barrier to entry. | Every 24h (06:00) | Upwork, Fiverr, Contra, Toptal, Wellfound, We Work Remotely | Daily Top 3 gigs, difficulty matrix, 5-step SOP delivery playbooks, proposal skeletons |
| **SCOUT-02** | Zero-Ship Product Scout | Sinks through ecommerce and dropship suppliers for high-margin products with zero physical inventory footprint. | Every 24h (07:00) | Shopify Trend Feeds, TikTok Shop, Temu, AliExpress, Etsy, Printify, Impact | Top 3 zero-ship products, landed vs. sell pricing, supplier routes, short-form video hooks |
| **RADAR-03** | Trend & Weak-Signal Radar | Identifies nascent search surges, emerging tech stacks, and community problem spikes before they saturate. | Every 12h | Google Trends, Reddit, X / Twitter, GitHub Trending, Product Hunt, Hacker News | Weak-signal dossiers, demand-to-supply gap ratios, rookie-to-expert skill ladders |
| **ANALYST-04** | Top-5 Benchmark Analyst | Performs competitive teardowns of the top 5 players in winning categories, identifying why #1 wins and engineering an improved System Prompt v2. | Every 24h | Upstream agent feeds, competitor pricing pages, app review corpora | 25-cell delta matrices, positioning teardowns, ready-to-deploy System Prompt v2 specs |
| **GROWTH-05** | Free-Channel Growth Strategist | Formulates zero-budget organic distribution plans, 90-day execution sequences, and curates free-tier tech stacks. | On Demand / Daily | GitHub releases, open-source repositories, developer tools | 90-day organic channel blueprints, zero-dollar software stacks with usage limits, custom skill files |
| **FORGE-06** | Skill Compounder & Cartographer | Charts emerging AI agent architectures (Claude Skills, OpenAI SDK, LangGraph, MCP) and fuses multiple complex workflows into 1 unified skill. | Weekly & On Demand | Model Context Protocol (MCP) registry, Agent SDKs, GitHub agent topics | Platform compatibility maps, parsed SKILL.md blueprints, 7-to-1 compounded skills, permission manifests |
| **AXIS-07** | Chief of Staff & Final Path | Senior synthesizer that reviews all upstream reports against user time/budget constraints, resolves contradictions, and delivers one clear path. | Every 24h (Post-Ingest) | Outputs of SCOUT-01 through FORGE-06, saved user pipeline | 14-day execution path with daily checkpoints, kill criteria, and cadence recommendations |

---

## Architecture & Workflow Breakdown

### 1. Agent Ingest & Sweep Flow

When a sweep is triggered (via manual UI action, scheduled cron, or REST API):
1. **Target Gathering**: The server agent runner (`server/agents.ts`) receives the request with optional focus directives (e.g., *"API documentation portals"* or *"Restaurant shift automation"*).
2. **Model Inference**: If a `GEMINI_API_KEY` is present, the server uses the official `@google/genai` TypeScript SDK with `gemini-3.7-flash` to query and reason over live platform schemas.
3. **Actionable Findings Extraction**: The model outputs structured JSON conforming to a strict TypeScript interface:
   - Rank, Title, Source Name, and Verified Source URL
   - Difficulty (1–10) and Viability Score (0–100)
   - Realistic Payout and Estimated Time-to-Value
   - 5-Step Step-by-Step Delivery Playbook
4. **Resilient Fallback Engine**: If offline or if rate limits are encountered, the engine gracefully transitions to high-fidelity simulated baseline data with explicit `SIMULATED` provenance tags, preventing broken states.
5. **Database Recording**: The execution run and individual findings are atomically committed to SQLite (`agent_runs` and `findings`), creating full provenance history.

### 2. Synthesis Engine & Path Generation

When generating the Final Path Report:
1. **Constraint Injection**: AXIS-07 reads the member's profile limits (hours/week, software budget, experience level).
2. **Upstream Ingestion**: AXIS-07 analyzes recent findings from all other agents (`SCOUT-01` through `FORGE-06`).
3. **Conflict Resolution**: If two agents offer opposing recommendations (e.g., building a broad digital product vs. launching a high-ticket service sprint), AXIS-07 explicitly chooses one and documents the rationale.
4. **Structured Milestone Output**: Produces 5 chronological steps with:
   - Specific Action & Associated Agent
   - Allocated Time & Days
   - Verification Checkpoint (how you know it worked)
   - Hard Kill-Criteria (when to abandon or pivot)
5. **Next 24h Directive**: Identifies the single most impactful task for the upcoming day.

### 3. Pipeline Funnel & Kanban

Opportunities discovered during agent sweeps can be saved directly into the user's opportunity pipeline. The funnel tracks leads across five stages:

```
[ Saved ] ──> [ Outreach ] ──> [ In Progress ] ──> [ Delivered ] ──> [ Archived ]
```

- Every status change logs an entry in `status_history` with timestamp and optional notes.
- Users can log internal notes, client feedback, and delivery milestones.
- Filter and search by agent, score, difficulty, and keywords.

### 4. Intermediary Bridge & Proxy Gateway

The platform provides a secure bridge for external client sites (e.g., Kitchen & Code storefronts, client partner portals) to access agent services without exposing database credentials or Google Gemini API keys:

```
[ External Partner / App ]
          │
          │  POST /api/proxy/agent
          │  Header: Authorization: Bearer <raw_secret_key>
          ▼
┌──────────────────────────────────────────────────────────┐
│             INTERMEDIARY BRIDGE VALIDATOR                │
│  1. Extracts Bearer token                                │
│  2. Computes SHA-256 hash                                │
│  3. Verifies against bridge_keys table                   │
│  4. Enforces per-minute rate limits                      │
│  5. Dispatches to target agent (e.g., freelance-scout)   │
│  6. Logs IP, latency, and status code to proxy_logs      │
└──────────────────────────────────────────────────────────┘
```

---

## Database Schema & Data Persistence

The backend utilizes `better-sqlite3` configured with **Write-Ahead Logging (WAL)** for concurrent read/write performance. All tables are automatically initialized and migrated on server boot:

| Table Name | Purpose | Key Columns |
| :--- | :--- | :--- |
| `users` | Secure user accounts | `id`, `email`, `password_hash`, `created_at` |
| `sessions` | Bearer token session tracking | `id`, `user_id`, `token`, `expires_at` |
| `profiles` | Member constraints & preferences | `user_id`, `display_name`, `hours_per_week`, `budget_usd`, `covenant_accepted_at` |
| `agent_runs` | Record of every executed agent cycle | `id`, `agent_id`, `codename`, `status`, `model`, `latency_ms`, `provenance`, `created_at` |
| `findings` | Individual opportunities found in sweeps | `id`, `run_id`, `agent_id`, `title`, `source_name`, `score`, `payout`, `playbook_json` |
| `saved_opportunities` | Pipeline Kanban items | `id`, `owner_key`, `title`, `status`, `status_history`, `notes` |
| `final_reports` | Synthesized AXIS-07 paths | `id`, `user_id`, `title`, `steps_json`, `conflicts_json`, `completed_steps` |
| `agent_schedules` | Automated recurring run cadences | `id`, `agent_id`, `cadence`, `is_active`, `last_run_at`, `next_run_at` |
| `bridge_keys` | Hashed API keys for external bridges | `id`, `user_id`, `name`, `hashed_key`, `key_prefix`, `permissions`, `rate_limit_per_minute` |
| `proxy_logs` | Gateway audit trail | `id`, `key_id`, `source_client`, `target_agent`, `status_code`, `latency_ms`, `timestamp` |
| `audit_logs` | System security event logs | `id`, `user_id`, `action`, `target`, `outcome`, `ip_address`, `created_at` |

---

## Step-by-Step Operator Guide

### Step 1: Account Creation & The Community Covenant
1. Launch the application and click **Sign Up** or **Sign In**.
2. Enter your email and secure password.
3. Review and accept the **Community Covenant**: agree to ethical deployment, human oversight ("Report, never act"), and fair client practices.

### Step 2: Running Your First Agent Sweep
1. In the sidebar or top bar, select any specialist agent (e.g., **SCOUT-01** or **RADAR-03**).
2. Click **Run Agent Sweep**.
3. Optionally enter a **Custom Focus** (e.g., *"Healthcare clinic Notion workflows"*).
4. Watch the live agent execution telemetry: observe latency, model attribution (`gemini-3.7-flash`), and retrieved listings.

### Step 3: Inspecting Findings & Execution Playbooks
1. Each finding displays a title, verified source platform, difficulty rating (1–10), and potential payout.
2. Click on a finding to expand its **5-Step Delivery Playbook**.
3. Click **Save to Pipeline** to track the opportunity through your funnel.

### Step 4: Tracking Your Opportunities in the Pipeline
1. Navigate to the **Pipeline** view.
2. Filter your opportunities across **Saved**, **Outreach**, **In Progress**, **Delivered**, and **Archived**.
3. Add custom operational notes or client status updates directly to each card.

### Step 5: Generating Your Linear Path (AXIS-07)
1. Select **AXIS-07 (Chief of Staff)** from the agent navigation.
2. Click **Synthesize New Path**.
3. AXIS-07 scans your saved opportunities and upstream agent runs, generating a 5-step milestone path with verification checkpoints and kill criteria.
4. Mark milestones as completed as you make progress.

### Step 6: Configuring the Intermediary Bridge
1. Open the **Bridge & Intermediary** dashboard (or click **Bridge Intermediary** in the header).
2. Click **Generate New Key**.
3. Copy the full secret key (prefixed with `myf_bridge_`).
4. Test the proxy with cURL (see API reference below). All requests are logged in the **Proxy Telemetry** table.

---

## API Specification & Endpoints

### System Health
```http
GET /api/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-09-13T06:18:19.481Z",
  "uptimeSeconds": 128
}
```

---

### Authentication
```http
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
GET  /api/auth/session
GET  /api/auth/profile
PUT  /api/auth/profile
```

---

### Trigger Agent Sweeps
```http
POST /api/agent/run
Content-Type: application/json
Authorization: Bearer <session_token> (Optional)

{
  "agentId": "freelance-scout",
  "trigger": "manual",
  "customFocus": "Technical writing and API documentation"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "ran": 1,
  "run": {
    "run_id": "run_204a457615ed47b066c24a0c",
    "agent_id": "freelance-scout",
    "codename": "SCOUT-01",
    "status": "complete",
    "headline": "High-demand sweep reveals immediate opportunities...",
    "model": "gemini-3.7-flash",
    "latency_ms": 8285,
    "findings_count": 3,
    "findings": [
      {
        "rank": 1,
        "title": "OpenAPI 3.1 Spec Generation & Mintlify Portal Setup",
        "source_name": "Upwork",
        "payout": "$600 – $1,500",
        "playbook": [
          "Step 1: Request exported Postman collections...",
          "Step 2: Feed endpoint schemas into Gemini..."
        ]
      }
    ]
  }
}
```

---

### Pipeline Opportunities
```http
GET    /api/pipeline
POST   /api/pipeline
PUT    /api/pipeline/:id
DELETE /api/pipeline/:id
```

---

### AXIS-07 Synthesis Reports
```http
GET  /api/reports
POST /api/reports/generate
POST /api/reports/:id/step
```

---

### Intermediary Bridge & Proxy Agent Route
```http
POST /api/proxy/agent
Authorization: Bearer myf_bridge_your_secret_key_here
Content-Type: application/json

{
  "agentId": "freelance-scout",
  "sourceClient": "Kitchen&Code Storefront",
  "focus": "Restaurant Shift Scheduling & Margin Optimization"
}
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/maximize-your-future.git
cd maximize-your-future
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and configure your credentials:
```ini
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/myf.sqlite

# Google Gemini API Key (Required for live agent intelligence)
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 4. Start the Development Server
```bash
npm run dev
```
The application will boot at `http://localhost:3000`.

---

## Build & Deployment Guide

### Production Build
The project compiles both frontend client assets (Vite) and the backend server bundle (esbuild) into a unified CommonJS distribution:
```bash
npm run build
```
This produces:
- `dist/` containing optimized static client assets
- `dist/server.cjs` containing the bundled Node.js/Express server

### Production Start
```bash
npm run start
```

### Cloud Run & Container Deployment
The application is pre-configured to bind to `0.0.0.0:3000`. For Google Cloud Run or Docker deployments, ensure `PORT=3000` and mount a persistent volume at `/data` for `DATABASE_PATH=./data/myf.sqlite`.

---

## SQLite Production Posture & Scaling Architecture

The platform uses Node.js native SQLite (`node:sqlite`) with production-hardened concurrency semantics:

### 1. Concurrency & Journal Configuration
- **WAL Mode Enabled**: Initialized automatically via `PRAGMA journal_mode = WAL;`. Write-Ahead Logging allows concurrent readers to execute unhindered while background writes complete.
- **Synchronous NORMAL**: `PRAGMA synchronous = NORMAL;` optimizes write latency without compromising database integrity across crashes.
- **Busy Timeout & Foreign Keys**: `PRAGMA busy_timeout = 5000;` and `PRAGMA foreign_keys = ON;` enforce relational referential integrity.
- **Atomic Concurrency (Lease Claiming)**: Multi-worker and background scheduler jobs claim work using atomic `UPDATE ... WHERE claimed_at IS NULL` semantics with lease timeouts, preventing double-execution races.

### 2. Single-Instance Container Lifecycle
- **Topology**: Designed as an authoritative single-instance container or stateful set.
- **Storage Persistence**: A persistent volume or network disk (e.g. Google Cloud Storage FUSE or Cloud Run Network File System mount) MUST be mapped to `./data` (or the directory configured via `DATABASE_PATH`). Ephemeral container restarts preserve all history, sessions, rate-limit buckets, and pipeline items without data loss.

### 3. Backup & Snapshot Best Practices
- **Online Hot Backups**: SQLite's VACUUM INTO or sqlite3 online backup command can be executed live while the application is receiving traffic:
  ```bash
  sqlite3 ./data/myf.sqlite ".backup './backups/backup-$(date +%F).sqlite'"
  ```
- **Automated Cron Snapshotting**: Mount an automated snapshot script to ship encrypted backups daily to Google Cloud Storage (`gsutil cp`).

### 4. Zero-Downtime Migration Path to PostgreSQL / Cloud SQL
When enterprise load requires horizontal read/write multi-master scaling:
1. **Schema Parity**: The database schema in `server/db.ts` uses ANSI standard types (`TEXT`, `INTEGER`, `REAL`, `JSON`) compatible directly with PostgreSQL.
2. **Connector Swap**: Replace `node:sqlite` connection factory in `server/db.ts` with `@neondatabase/serverless`, `pg`, or Drizzle ORM connecting to Cloud SQL (PostgreSQL).
3. **Session & Rate-Limit Compatibility**: All queries use parameterized statements (`?` / `$1`) and standard SQL syntax, enabling seamless transition without rewriting business logic.

---

## Security & Telemetry Audit

- **Zero Client-Side Secret Exposure**: All API keys, including `GEMINI_API_KEY`, operate strictly on the Express server. The browser client never receives API keys.
- **Cryptographic Hashing**: All Intermediary Bridge tokens are generated with high entropy and stored exclusively as SHA-256 digests. Raw keys are presented to the operator only once upon creation.
- **Session Protection at Rest**: User session tokens are hashed with SHA-256 before storage; database compromises cannot yield valid active bearer tokens.
- **Strict Server-Side Identity**: User authorization is derived exclusively from validated bearer sessions (`req.user.id`). Client-provided user IDs, query parameters, and body keys are never trusted for private resource access.
- **Truthful Provenance**: All findings and reports declare their origin explicitly (`LIVE_SOURCE`, `MODEL_INFERENCE`, or `SIMULATED_DEMO`).
- **Comprehensive Audit Trails**: Every key revocation, sweep execution, pipeline status change, and proxy request is permanently logged in `audit_logs` and `proxy_logs` with timestamps, latency, and client IP addresses.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
