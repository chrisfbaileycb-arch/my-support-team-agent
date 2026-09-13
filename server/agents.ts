import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { getDatabase } from './db';

export interface AgentContract {
  id: string;
  codename: string;
  name: string;
  role: string;
  domain: string;
  systemPrompt: string;
  rankingCriteria: string[];
  allowedActions: string[];
  prohibitedActions: string[];
  defaultScanTargets: string[];
}

export const AGENT_CONTRACTS: Record<string, AgentContract> = {
  'freelance-scout': {
    id: 'freelance-scout',
    codename: 'SCOUT-01',
    name: 'Freelance Work Scout',
    role: 'Opportunity Discovery',
    domain: 'Freelance marketplaces & remote gig listings (Upwork, Fiverr, Contra)',
    rankingCriteria: [
      'Recency (< 24h old listings)',
      'Learnability for solo operators with AI assistance',
      'Repeatability as a packaged client SOP',
      'Client payment reputation and budget verified signal',
    ],
    allowedActions: ['Sweep public postings', 'Filter by learnability', 'Template delivery playbooks', 'Generate proposal drafts'],
    prohibitedActions: ['Submit proposals automatically', 'Message clients directly', 'Access private client credentials'],
    defaultScanTargets: ['Upwork', 'Fiverr Pro', 'Contra', 'Toptal', 'Wellfound'],
    systemPrompt: `You are SCOUT-01, a freelance opportunity discovery specialist.
Your mission is to find high-signal client gigs that a solo operator can deliver using AI workflows.
Filter strictly for learnability (can a beginner ship this in 3-5 days?), repeatable deliverable architecture, and realistic budgets.
NEVER apply or bid on behalf of the user. Output ranked opportunities with actionable 5-step delivery playbooks.`,
  },

  'product-scout': {
    id: 'product-scout',
    codename: 'MERCH-02',
    name: 'Zero-Ship Commerce Scout',
    role: 'Digital Asset & Template Sourcing',
    domain: 'Zero-inventory digital templates, Notion packs, software SOPs, and printable downloads',
    rankingCriteria: [
      'Zero upfront inventory requirement',
      'Instant digital delivery margin (> 90%)',
      'Search velocity and organic demand on marketplace search',
      'Speed to publish asset',
    ],
    allowedActions: ['Identify digital asset niches', 'Analyze bundle pricing', 'Generate template specifications'],
    prohibitedActions: ['Order physical inventory', 'Create paid ad spend without approval', 'Commit operator funds'],
    defaultScanTargets: ['Gumroad', 'Etsy Digital', 'Shopify App Store', 'Notion Marketplace', 'Creative Market'],
    systemPrompt: `You are MERCH-02, specializing in zero-inventory digital products and asset templates.
Find digital product opportunities with zero physical manufacturing, instant fulfillment, and 90%+ margins.
Specify bundle structures, target customer segments, and clear delivery mechanics.`,
  },

  'trend-radar': {
    id: 'trend-radar',
    codename: 'RADAR-03',
    name: 'Weak Signal Radar',
    role: 'Emerging Trend Detection',
    domain: 'Search query spikes, rising subreddit velocity, developer repo star velocity',
    rankingCriteria: [
      'Rate-of-change velocity vs historical baseline',
      'Low commercial saturation (early window of opportunity)',
      'Operator applicability with current AI tooling',
    ],
    allowedActions: ['Analyze keyword velocity', 'Synthesize community pain points', 'Flag emerging tech shifts'],
    prohibitedActions: ['Extrapolate unfounded financial advice', 'Recommend speculative assets'],
    defaultScanTargets: ['Google Trends', 'GitHub Trending', 'Reddit r/entrepreneur', 'Product Hunt', 'Hacker News'],
    systemPrompt: `You are RADAR-03, an early-signal intelligence radar.
Identify rapidly accelerating search queries, unsolved developer complaints, and emerging market gaps.
Filter out noise and hype. Focus on real, actionable demand shifts.`,
  },

  'benchmark-analyst': {
    id: 'benchmark-analyst',
    codename: 'BENCH-04',
    name: 'Benchmark & Unit Economics Analyst',
    role: 'Financial & Pricing Rigor',
    domain: 'Unit economics, retainer conversions, billable rate benchmarks, margin modeling',
    rankingCriteria: [
      'Margin sustainability (> 70%)',
      'Realistic time-to-first-dollar (< 14 days)',
      'Retainer conversion potential (one-off to monthly recurring)',
    ],
    allowedActions: ['Calculate hourly dollar yield', 'Model client lifetime value', 'Stress-test pricing tiers'],
    prohibitedActions: ['Guarantee financial outcomes', 'Assume zero client churn'],
    defaultScanTargets: ['Consulting benchmarks', 'SaaS pricing indices', 'Freelance rate surveys'],
    systemPrompt: `You are BENCH-04, the financial sanity checker and benchmark analyst.
Audit business proposals for unit economics, realistic pricing, delivery hours, and retainer conversion.
Call out low-margin traps and advise on optimal value packaging.`,
  },

  'growth-strategist': {
    id: 'growth-strategist',
    codename: 'GROWTH-05',
    name: 'Distribution & Outreach Strategist',
    role: 'Zero-Budget Growth',
    domain: 'Value-first video audits, organic search intent, warm outreach templates',
    rankingCriteria: [
      'Zero advertising spend requirement',
      'High response probability via personalized value-add',
      'Scalability of outreach workflow',
    ],
    allowedActions: ['Draft personalized video audit scripts', 'Craft value-first outreach hooks', 'Map distribution channels'],
    prohibitedActions: ['Send unsolicited spam', 'Scrape protected emails', 'Misrepresent sender credentials'],
    defaultScanTargets: ['Cold email benchmarks', 'Short-form social distribution', 'Direct B2B outreach'],
    systemPrompt: `You are GROWTH-05, the zero-budget distribution strategist.
Design high-conversion, value-first client acquisition hooks.
Focus on free video audits, personalized problem diagnosis, and respectful outbound strategies.`,
  },

  'skill-compounder': {
    id: 'skill-compounder',
    codename: 'COMPOUND-06',
    name: 'Skill & IP Compounder',
    role: 'Asset Compounding',
    domain: 'Prompt chain architectures, reusable SOP repositories, client deliverable modularization',
    rankingCriteria: [
      'Reusability across future client contracts',
      'Modularity (can be connected to other agent workflows)',
      'Reduction in future delivery time (> 50%)',
    ],
    allowedActions: ['Standardize project deliverables into SOPs', 'Build reusable prompt chains', 'Catalog IP assets'],
    prohibitedActions: ['Expose client confidential information in public templates'],
    defaultScanTargets: ['Prompt engineering repositories', 'Internal knowledge bases', 'Workflow automations'],
    systemPrompt: `You are COMPOUND-06, ensuring that no client work is done once without being converted into a reusable asset.
Transform custom deliverables into standardized SOPs, prompts, and templates that compound in value.`,
  },

  'chief-of-staff': {
    id: 'chief-of-staff',
    codename: 'AXIS-07',
    name: 'Chief of Staff Synthesis',
    role: 'Path Synthesis & Conflict Resolution',
    domain: 'Linear 14-day path synthesis from multi-agent findings',
    rankingCriteria: [
      'Linear sequence clarity (1-5 ordered steps)',
      'Direct reconciliation of conflicting advice',
      'Strict adherence to user time and budget constraints',
    ],
    allowedActions: ['Reconcile competing agent recommendations', 'Order linear sprint checkpoints', 'Establish kill criteria'],
    prohibitedActions: ['Generate ambiguous generalities', 'Exceed user stated hour constraints'],
    defaultScanTargets: ['Database agent runs', 'Pipeline bookmarks', 'User profile constraints'],
    systemPrompt: `You are AXIS-07, Chief of Staff.
Synthesize findings from SCOUT-01 through COMPOUND-06 into a single, concrete 14-day linear execution path.
Resolve all conflicts explicitly. Enforce clear checkpoints and kill criteria.`,
  },
};

export interface RawFindingInput {
  rank?: number;
  title: string;
  source_name: string;
  source_url: string;
  source_type?: string;
  retrieved_at?: string;
  excerpt?: string;
  confidence?: number;
  is_direct_queried?: boolean;
  provenance?: string;
  summary: string;
  difficulty?: number;
  score?: number;
  payout?: string;
  time_to_value?: string;
  tags?: string[];
  playbook?: string[];
}

export interface StoredRunResult {
  run_id: string;
  agent_id: string;
  codename: string;
  user_id: string;
  trigger: string;
  status: 'complete' | 'simulated' | 'failed';
  headline: string;
  warning: string | null;
  error: string | null;
  model: string;
  provider: string;
  latency_ms: number;
  source_count: number;
  findings_count: number;
  is_live: boolean;
  is_fallback: boolean;
  findings: RawFindingInput[];
  created_at: string;
}

export async function executeAgentSweep(params: {
  userId: string;
  agentId: string;
  focus?: string;
  trigger?: 'manual' | 'scheduled';
}): Promise<StoredRunResult> {
  const startTime = Date.now();
  const db = getDatabase();
  const contract = AGENT_CONTRACTS[params.agentId] || AGENT_CONTRACTS['freelance-scout'];
  const trigger = params.trigger || 'manual';
  const requestedFocus = (params.focus || '').trim();

  const runId = 'run_' + crypto.randomBytes(12).toString('hex');
  const apiKey = process.env.GEMINI_API_KEY;

  let isLive = false;
  let isFallback = false;
  let status: 'complete' | 'simulated' | 'failed' = 'simulated';
  let headline = '';
  let warning: string | null = null;
  const modelUsed = 'gemini-3.7-flash';
  const provider = 'Google Gemini (Google DeepMind)';
  let findings: RawFindingInput[] = [];

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
${contract.systemPrompt}

User Custom Context: "${requestedFocus || 'Default domain exploration'}"
Target Domain: ${contract.domain}
Allowed Scan Targets: ${contract.defaultScanTargets.join(', ')}

Perform an opportunity sweep. Output EXACTLY 3 high-leverage opportunities.
Return strictly valid JSON matching this schema:
{
  "headline": "One clear executive summary sentence of the current sweep",
  "findings": [
    {
      "rank": 1,
      "title": "Clear actionable title",
      "source_name": "Specific platform (e.g. Upwork, Fiverr, Google Trends)",
      "source_url": "https://...",
      "source_type": "marketplace_search",
      "excerpt": "Specific evidence quote or signal metric",
      "confidence": 0.92,
      "summary": "2 sentence explanation of why this is actionable now",
      "difficulty": 3,
      "score": 92,
      "payout": "$500 – $1,200",
      "time_to_value": "3 days",
      "tags": ["AI-Ops", "Templatable", "B2B"],
      "playbook": [
        "Step 1: Specific action",
        "Step 2: Specific action",
        "Step 3: Specific action",
        "Step 4: Specific action",
        "Step 5: Specific action"
      ]
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: modelUsed,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.findings && Array.isArray(parsed.findings) && parsed.findings.length > 0) {
        headline = parsed.headline || `Live synthesis completed for ${contract.codename}`;
        findings = parsed.findings.map((f: RawFindingInput, idx: number) => ({
          rank: f.rank || idx + 1,
          title: f.title || 'Untitled Opportunity',
          source_name: f.source_name || contract.defaultScanTargets[0] || 'Marketplace',
          source_url: f.source_url || 'https://www.upwork.com',
          source_type: f.source_type || 'marketplace_search',
          retrieved_at: new Date().toISOString(),
          excerpt: f.excerpt || `Direct inference extracted via ${modelUsed}`,
          confidence: Number(f.confidence) || 0.88,
          is_direct_queried: true,
          provenance: 'MODEL INFERENCE',
          summary: f.summary || '',
          difficulty: Math.min(10, Math.max(1, Number(f.difficulty) || 5)),
          score: Math.min(100, Math.max(0, Number(f.score) || 80)),
          payout: f.payout || '$500 – $1,000',
          time_to_value: f.time_to_value || '3–5 days',
          tags: Array.isArray(f.tags) ? f.tags.slice(0, 4) : ['AI-Assisted'],
          playbook: Array.isArray(f.playbook) ? f.playbook : ['Define scope', 'Build template', 'Deliver result'],
        }));
        isLive = true;
        isFallback = false;
        status = 'complete';
      } else {
        throw new Error('Model returned empty findings array');
      }
    } catch (err) {
      console.warn(`Gemini live sweep failed for ${contract.codename}:`, err instanceof Error ? err.message : err);
      isLive = false;
      isFallback = true;
      status = 'simulated';
      warning = 'SIMULATED / DEMO DATA: Live Gemini synthesis encountered an error or quota limit. Displaying demonstrative fixture.';
    }
  } else {
    isLive = false;
    isFallback = true;
    status = 'simulated';
    warning = 'SIMULATED / DEMO DATA: GEMINI_API_KEY is not configured in server environment. Displaying demonstrative benchmark fixture.';
  }

  // If fallback or simulated, load deterministic labeled demo fixtures
  if (status === 'simulated' || findings.length === 0) {
    findings = getSimulatedFindings(contract, requestedFocus);
    headline = `[SIMULATED DEMO] Benchmark sweep for ${contract.codename} (${requestedFocus || 'Standard Domain'})`;
  }

  const latencyMs = Date.now() - startTime;
  const createdAt = new Date().toISOString();

  // Save to agent_runs
  const runStmt = db.prepare(`
    INSERT INTO agent_runs (
      id, user_id, agent_id, codename, trigger, status, headline, warning, error,
      model, provider, latency_ms, source_count, findings_count, is_live, is_fallback,
      requested_focus, started_at, completed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  runStmt.run(
    runId,
    params.userId,
    contract.id,
    contract.codename,
    trigger,
    status,
    headline,
    warning,
    null,
    modelUsed,
    provider,
    latencyMs,
    contract.defaultScanTargets.length,
    findings.length,
    isLive ? 1 : 0,
    isFallback ? 1 : 0,
    requestedFocus || null,
    new Date(startTime).toISOString(),
    createdAt,
    createdAt
  );

  // Save findings
  const findingStmt = db.prepare(`
    INSERT INTO run_findings (
      id, run_id, user_id, agent_id, rank, title, source_name, source_url, source_type,
      retrieved_at, excerpt, confidence, is_direct_queried, provenance, summary,
      difficulty, score, payout, time_to_value, tags, playbook, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const f of findings) {
    const findingId = 'fnd_' + crypto.randomBytes(10).toString('hex');
    findingStmt.run(
      findingId,
      runId,
      params.userId,
      contract.id,
      f.rank || 1,
      f.title,
      f.source_name,
      f.source_url,
      f.source_type || 'simulated_fixture',
      f.retrieved_at || createdAt,
      f.excerpt || null,
      f.confidence || 0.7,
      f.is_direct_queried ? 1 : 0,
      f.provenance || (isLive ? 'MODEL INFERENCE' : 'SIMULATED'),
      f.summary,
      f.difficulty || 5,
      f.score || 70,
      f.payout || '$500',
      f.time_to_value || '3 days',
      JSON.stringify(f.tags || []),
      JSON.stringify(f.playbook || []),
      createdAt
    );
  }

  return {
    run_id: runId,
    agent_id: contract.id,
    codename: contract.codename,
    user_id: params.userId,
    trigger,
    status,
    headline,
    warning,
    error: null,
    model: modelUsed,
    provider,
    latency_ms: latencyMs,
    source_count: contract.defaultScanTargets.length,
    findings_count: findings.length,
    is_live: isLive,
    is_fallback: isFallback,
    findings,
    created_at: createdAt,
  };
}

function getSimulatedFindings(contract: AgentContract, focus: string): RawFindingInput[] {
  const time = new Date().toISOString();
  if (contract.id === 'freelance-scout') {
    return [
      {
        rank: 1,
        title: `AI Booking & FAQ Assistant Setup for ${focus || 'Local Services'}`,
        source_name: 'Upwork (Simulated Benchmark)',
        source_url: 'https://www.upwork.com/nx/search/jobs/?q=ai%20chatbot',
        source_type: 'simulated_fixture',
        retrieved_at: time,
        excerpt: 'Historical platform pattern: steady demand from clinics and contractors needing appointment automation.',
        confidence: 0.75,
        is_direct_queried: false,
        provenance: 'SIMULATED',
        summary: 'Package a repeatable Gemini/Voiceflow booking agent for local service websites with minimal custom code.',
        difficulty: 3,
        score: 91,
        payout: '$450 – $1,200',
        time_to_value: '2–4 days',
        tags: ['No-Code', 'SOP', 'Recurring-Potential'],
        playbook: [
          'Clone standardized booking assistant flow.',
          'Inject client website FAQ knowledge base.',
          'Connect to client Google Calendar link.',
          'Record 3-minute video walkthrough as handoff.',
          'Pitch $99/mo ongoing tuning retainer.',
        ],
      },
      {
        rank: 2,
        title: 'Vertical Video Repurposing from Podcasts/Webinars',
        source_name: 'Fiverr Pro (Simulated Benchmark)',
        source_url: 'https://www.fiverr.com/search/gigs?query=podcast%20clips',
        source_type: 'simulated_fixture',
        retrieved_at: time,
        excerpt: 'High search volume: creators needing short-form highlights from hour-long recordings.',
        confidence: 0.75,
        is_direct_queried: false,
        provenance: 'SIMULATED',
        summary: 'Extract 15 vertical clips per episode with AI transcription and hook formatting.',
        difficulty: 2,
        score: 87,
        payout: '$350 – $800 / mo',
        time_to_value: '1–2 days',
        tags: ['Content-Ops', 'Quick-Win'],
        playbook: [
          'Run video through automated transcription.',
          'Select top 3 emotional hook timestamps.',
          'Format with 9:16 layout and bold captions.',
          'Deliver batch in Google Drive shared folder.',
        ],
      },
      {
        rank: 3,
        title: 'Google Workspace Internal SOP Documentation Kit',
        source_name: 'Contra (Simulated Benchmark)',
        source_url: 'https://contra.com',
        source_type: 'simulated_fixture',
        retrieved_at: time,
        excerpt: 'Growing request rate: small businesses migrating legacy docs into structured Gemini workspace templates.',
        confidence: 0.75,
        is_direct_queried: false,
        provenance: 'SIMULATED',
        summary: 'Turn scattered operational notes into formatted Google Docs and Tasks checklists.',
        difficulty: 2,
        score: 84,
        payout: '$500 – $950',
        time_to_value: '3 days',
        tags: ['Workspace', 'SOP'],
        playbook: [
          'Conduct 30-minute voice interview of daily routine.',
          'Generate clean Markdown procedure manual.',
          'Format with tables and checklists in Google Docs.',
          'Set up recurring review reminder on Google Calendar.',
        ],
      },
    ];
  }

  // Default simulated generator for other agents
  return [
    {
      rank: 1,
      title: `${contract.name}: Packaged ${focus || 'Operations'} Sprint`,
      source_name: `${contract.defaultScanTargets[0]} (Simulated Benchmark)`,
      source_url: 'https://github.com/trending',
      source_type: 'simulated_fixture',
      retrieved_at: time,
      excerpt: `Demonstrative benchmark synthesized for ${contract.codename}.`,
      confidence: 0.7,
      is_direct_queried: false,
      provenance: 'SIMULATED',
      summary: `Standardized operational template addressing pain points in ${focus || 'current domain'}.`,
      difficulty: 3,
      score: 86,
      payout: '$600 – $1,500',
      time_to_value: '4 days',
      tags: ['Operational', 'Repeatable'],
      playbook: [
        'Audit current operational bottleneck.',
        'Apply standardized prompt template.',
        'Generate test deliverable in under 2 hours.',
        'Hand over to stakeholder with review checklist.',
      ],
    },
    {
      rank: 2,
      title: `${contract.codename} Niche Micro-Template Offer`,
      source_name: `${contract.defaultScanTargets[1] || 'Digital Marketplace'} (Simulated Benchmark)`,
      source_url: 'https://gumroad.com',
      source_type: 'simulated_fixture',
      retrieved_at: time,
      excerpt: 'Zero-marginal cost delivery with high perceived value.',
      confidence: 0.7,
      is_direct_queried: false,
      provenance: 'SIMULATED',
      summary: 'Turn verified internal process into a copy-paste digital asset.',
      difficulty: 2,
      score: 82,
      payout: '$150 – $400 / unit',
      time_to_value: '2 days',
      tags: ['Digital-Asset', 'Passive'],
      playbook: [
        'Export master framework into clean template format.',
        'Add 5-minute video tutorial on usage.',
        'Publish product link with transparent pricing.',
      ],
    },
  ];
}
