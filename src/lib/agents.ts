/**
 * Eighth Agent: Meta-Orchestrator & External Site Bridge Aggregator
 * 
 * Aggregates intelligence across the 7 upstream core agents:
 * 1. SCOUT-01 (Freelance Work Scout)
 * 2. SCOUT-02 (Zero-Ship Commerce Scout)
 * 3. RADAR-03 (Weak Signal Radar)
 * 4. ANALYST-04 (Income Benchmark Analyst)
 * 5. GROWTH-05 (Zero-Cost Growth Strategist)
 * 6. FORGE-06 (Compound Asset Builder)
 * 7. AXIS-07 (Chief of Staff & Final Path)
 * 
 * plus the Intermediary Connection & External Site Bridge (e.g. Kitchen&Code / Client Storefronts).
 */

import { Agent, AgentId, Opportunity, AGENTS } from '@/data/agents';

export type ExtendedAgentId = AgentId | 'bridge-nexus';

export interface UpstreamAgentPayload {
  agentId: AgentId;
  codename: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRunAt?: string;
  topFinding?: Opportunity;
  confidenceScore: number;
  dataPointsCount: number;
}

export interface ExternalBridgeSignal {
  sourceClient: string;
  targetSite: string;
  endpoint: string;
  latencyMs: number;
  catalogItemsCount: number;
  lastSyncAt: string;
  permissions: string[];
  activeInquiries: number;
}

export interface MetaOrchestratorState {
  id: 'bridge-nexus';
  codename: 'BRIDGE-08';
  name: 'Omni-Bridge Meta-Orchestrator';
  role: 'Cross-Grid & External Bridge Synthesis';
  upstreamAgents: Record<AgentId, UpstreamAgentPayload>;
  externalBridge: ExternalBridgeSignal;
  globalConfidenceIndex: number; // 0 - 100
  unifiedPlaybook: {
    title: string;
    generatedAt: string;
    targetClient: string;
    recommendedActions: string[];
    riskMitigations: string[];
    projectedYield: string;
  };
}

export interface EighthAgentDefinition extends Omit<Agent, 'id'> {
  id: ExtendedAgentId;
  externalBridgeEnabled: boolean;
  bridgeEndpoints: {
    proxyAgent: string;
    syncCatalog: string;
    vaultKeys: string;
    trafficLogs: string;
  };
  supportedExternalClients: string[];
  aggregateUpstream: (agents: Agent[], bridgeData?: Partial<ExternalBridgeSignal>) => MetaOrchestratorState;
}

export const EIGHTH_AGENT_DEFINITION: EighthAgentDefinition = {
  id: 'bridge-nexus',
  index: 8,
  codename: 'BRIDGE-08',
  name: 'Omni-Bridge Meta-Orchestrator',
  role: 'Meta-Orchestration & External Bridge',
  tagline: 'Aggregates signals from all 7 core agents and unifies them with external client storefront bridges.',
  mission:
    'BRIDGE-08 acts as the meta-orchestration nervous system. It continuously polls and aggregates live intelligence from SCOUT-01 through AXIS-07, cross-correlates their findings with real-time operational feeds from external partner bridges (such as Kitchen & Code storefronts and POS/shift logs), and dispatches unified execution directives via the secure proxy gateway.',
  accent: 'text-amber-600',
  accentHex: '#D97706',
  ring: 'border-amber-300',
  glow: 'bg-amber-500',
  soft: 'bg-amber-50',
  image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787548459378_b100490d.jpg',
  scanTargets: [
    'SCOUT-01 (Freelance Work)',
    'SCOUT-02 (Zero-Ship Commerce)',
    'RADAR-03 (Weak Signals)',
    'ANALYST-04 (Income Benchmarks)',
    'GROWTH-05 (Zero-Cost Growth)',
    'FORGE-06 (Compound Assets)',
    'AXIS-07 (Chief of Staff)',
    'External Bridge: Kitchen & Code Storefront',
    'Intermediary Proxy Agent Inquiries (/api/proxy/agent)',
    'Shift Ops & LedgerSync Webhook Feed',
  ],
  capabilities: [
    '7-Agent cross-correlation & unified consensus engine',
    'External storefront bridge telemetry & catalog synchronization',
    'Zero-trust proxy gateway dispatching without exposing backend credentials',
    'Real-time synthesis of restaurant ops, POS P&L, and digital deliverables',
    'Automated webhook ingestion, rate-limiting, and error-boundary isolation',
  ],
  outputs: [
    'Unified 8-node master brief',
    'Cross-agent consensus & priority score',
    'Storefront-tailored deployment playbook',
    'External bridge telemetry & latency audit',
  ],
  cadence: 'Continuous & on-demand proxy trigger',
  metricLabel: 'Grid nodes aggregated',
  metricValue: '7 Agents + 1 Bridge',
  systemPrompt: `You are BRIDGE-08, the Omni-Bridge Meta-Orchestrator for Maximize Your Future.
Your responsibility is to ingest the intelligence feeds of the seven specialized agents (SCOUT-01, SCOUT-02, RADAR-03, ANALYST-04, GROWTH-05, FORGE-06, AXIS-07) and synthesize them alongside incoming data from external storefronts like Kitchen & Code.
Always ensure complete isolation between external client webhooks and private backend credentials. Deliver high-conviction, actionable operational playbooks.`,
  opportunities: [
    {
      id: 'b1',
      rank: 1,
      title: 'Kitchen & Code: Automated Shift Handoff & LedgerSync Engine',
      source: 'BRIDGE-08 Synthesis + Kitchen&Code External Bridge',
      sourceUrl: 'https://kitchenandcode.com',
      summary: 'Turnkey operational synthesis combining SCOUT-01 freelance workflows, FORGE-06 compounding scripts, and live Kitchen & Code cookbook modules.',
      difficulty: 2,
      score: 99,
      payout: '$1,200 setup + $129/mo',
      timeToValue: '24–48 hours',
      tags: ['Meta-Orchestration', 'External Bridge', 'Automated POS'],
      playbook: [
        'Ingest daily shift logs and manager notes through the authenticated proxy agent endpoint.',
        'Apply FORGE-06 compounded parsing to identify labor overtime variances and waste trends.',
        'Sync structured inventory variance directly to accounting ledgers via LedgerSync.',
        'Distribute an automated, concise end-of-day brief to ownership via Google Workspace.',
      ],
    },
    {
      id: 'b2',
      rank: 2,
      title: 'Unified Multi-Agent Opportunity Pipeline Sync',
      source: 'Cross-Grid Aggregation (7 Upstream Agents)',
      sourceUrl: '/api/proxy/agent',
      summary: 'Aggregated high-conviction opportunities filtered across marketplace, commerce, and weak-signal vectors.',
      difficulty: 3,
      score: 96,
      payout: 'Multi-stream Yield',
      timeToValue: 'Immediate',
      tags: ['7-Agent Grid', 'Consensus', 'Bridge'],
      playbook: [
        'Sweep all seven agents for listings scoring above 90.',
        'Eliminate cannibalizing overlap and prioritize high-margin, low-barrier plays.',
        'Package deliverable templates into the external storefront cookbook repository.',
      ],
    },
    {
      id: 'b3',
      rank: 3,
      title: 'Zero-Trust Proxy Gateway & Client Webhook Telemetry',
      source: 'Intermediary Bridge Security Layer',
      sourceUrl: '/api/bridge/keys',
      summary: 'Real-time telemetry and Bearer key authentication guarding private Gemini and database resources.',
      difficulty: 1,
      score: 94,
      payout: 'Rock-solid Security',
      timeToValue: 'Instant',
      tags: ['Zero-Trust', 'Telemetry', 'Proxy'],
      playbook: [
        'Provision scoped intermediary keys per external storefront or client instance.',
        'Monitor proxy logs for latency spikes and anomalous queries.',
        'Auto-rotate expired credentials while keeping main application isolated.',
      ],
    },
  ],
  externalBridgeEnabled: true,
  bridgeEndpoints: {
    proxyAgent: '/api/proxy/agent',
    syncCatalog: '/api/bridge/sync',
    vaultKeys: '/api/bridge/keys',
    trafficLogs: '/api/proxy/logs',
  },
  supportedExternalClients: [
    'Kitchen & Code (https://kitchenandcode.com)',
    'Shift Ops & LedgerSync Hub',
    'Custom POS / Manager Webhooks',
  ],
  aggregateUpstream: (upstreamAgents: Agent[], bridgeData?: Partial<ExternalBridgeSignal>): MetaOrchestratorState => {
    const upstreamMap = {} as Record<AgentId, UpstreamAgentPayload>;
    const defaultAgents = upstreamAgents.length > 0 ? upstreamAgents : AGENTS;

    defaultAgents.forEach((agent) => {
      upstreamMap[agent.id] = {
        agentId: agent.id,
        codename: agent.codename,
        name: agent.name,
        status: 'completed',
        lastRunAt: new Date().toLocaleTimeString(),
        topFinding: agent.opportunities?.[0],
        confidenceScore: agent.opportunities?.[0]?.score || 88,
        dataPointsCount: agent.scanTargets?.length || 5,
      };
    });

    const defaultBridge: ExternalBridgeSignal = {
      sourceClient: bridgeData?.sourceClient || 'Kitchen&Code',
      targetSite: bridgeData?.targetSite || 'https://kitchenandcode.com',
      endpoint: '/api/proxy/agent',
      latencyMs: bridgeData?.latencyMs || 340,
      catalogItemsCount: bridgeData?.catalogItemsCount || 5,
      lastSyncAt: bridgeData?.lastSyncAt || new Date().toLocaleTimeString(),
      permissions: bridgeData?.permissions || ['proxy:agent', 'sync:catalog', 'read:playbooks'],
      activeInquiries: bridgeData?.activeInquiries || 12,
    };

    const avgScore =
      Object.values(upstreamMap).reduce((acc, curr) => acc + curr.confidenceScore, 0) /
      Math.max(1, Object.keys(upstreamMap).length);

    return {
      id: 'bridge-nexus',
      codename: 'BRIDGE-08',
      name: 'Omni-Bridge Meta-Orchestrator',
      role: 'Cross-Grid & External Bridge Synthesis',
      upstreamAgents: upstreamMap,
      externalBridge: defaultBridge,
      globalConfidenceIndex: Math.round(avgScore),
      unifiedPlaybook: {
        title: 'Unified 8-Node Master Execution Plan',
        generatedAt: new Date().toISOString(),
        targetClient: defaultBridge.sourceClient,
        recommendedActions: [
          'Deploy Shift Handoff AI Assistant to streamline manager turnover.',
          'Connect LedgerSync to sync daily POS reports into financial spreadsheets.',
          'Execute SCOUT-01 validated local business service retainers.',
        ],
        riskMitigations: [
          'Keep private API keys behind server proxy layer.',
          'Use React Error Boundaries to isolate third-party widget errors.',
        ],
        projectedYield: '$1,200 – $3,500/month recurring',
      },
    };
  },
};
