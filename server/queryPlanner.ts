/**
 * Query Planner for "Maximize Your Future" Seven-Agent System
 *
 * Translates each agent's mission and user focus into concrete, domain-specific
 * retrieval strategies across available real source providers.
 *
 * AGENT STRATEGIES:
 * - SCOUT-01 (freelance-scout): Recent freelance & remote gig postings, roles, budgets, learnability signals.
 * - MERCH-02 (product-scout): Digital templates, zero-inventory assets, public catalog & tool trends.
 * - RADAR-03 (trend-radar): Developer discussion velocity, query spikes, repository star momentum.
 * - BENCH-04 (benchmark-analyst): Industry unit economics, pricing pages, rate surveys, margin benchmarks.
 * - GROWTH-05 (growth-strategist): Zero-budget distribution channels, organic marketing signals, public benchmarks.
 * - COMPOUND-06 (skill-compounder): Developer frameworks, reusable SDK patterns, public technical repositories.
 * - AXIS-07 (chief-of-staff): Synthesizes upstream agent evidence into a unified 14-day execution path.
 */

export interface AgentRetrievalPlan {
  agentId: string;
  codename: string;
  preferredProviders: string[];
  queries: string[];
  freshnessWindowHours: number;
  maxResults: number;
  intentSummary: string;
  unavailableTargetsExplanation?: string;
}

export function planAgentRetrieval(agentId: string, focus?: string): AgentRetrievalPlan {
  const normalizedFocus = (focus || '').trim();

  switch (agentId) {
    case 'freelance-scout':
    case 'SCOUT-01': {
      const tag = extractKeywords(normalizedFocus, ['ai', 'react', 'python', 'automation', 'node', 'fullstack']);
      return {
        agentId: 'freelance-scout',
        codename: 'SCOUT-01',
        preferredProviders: ['remoteok-jobs', 'hackernews-signals'],
        queries: [
          tag || 'ai',
          normalizedFocus ? `${normalizedFocus} remote` : 'freelance automation',
        ],
        freshnessWindowHours: 48,
        maxResults: 6,
        intentSummary: 'Sweep verified remote and freelance contract demands with real client budget and tech stack signals.',
        unavailableTargetsExplanation: 'Upwork and Fiverr private client databases are UNAVAILABLE_FOR_DIRECT_RETRIEVAL without user-specific OAuth credentials.',
      };
    }

    case 'product-scout':
    case 'MERCH-02': {
      return {
        agentId: 'product-scout',
        codename: 'MERCH-02',
        preferredProviders: ['public-feed-signals', 'hackernews-signals', 'github-repositories'],
        queries: [
          normalizedFocus ? `${normalizedFocus} template digital` : 'digital product template notion sops',
          'ai starter kit boilerplate',
        ],
        freshnessWindowHours: 168, // 7 days
        maxResults: 6,
        intentSummary: 'Detect zero-inventory template demands, developer toolkits, and digital asset niches.',
        unavailableTargetsExplanation: 'Gumroad private merchant analytics and Shopify private store backends are UNAVAILABLE_FOR_DIRECT_RETRIEVAL without merchant keys.',
      };
    }

    case 'trend-radar':
    case 'RADAR-03': {
      return {
        agentId: 'trend-radar',
        codename: 'RADAR-03',
        preferredProviders: ['hackernews-signals', 'github-repositories'],
        queries: [
          normalizedFocus || 'AI agents workflow',
          'LLM framework release',
        ],
        freshnessWindowHours: 24, // 24 hours
        maxResults: 8,
        intentSummary: 'Detect emerging weak signals from developer discussions, trending repositories, and tech communities.',
      };
    }

    case 'benchmark-analyst':
    case 'BENCH-04': {
      return {
        agentId: 'benchmark-analyst',
        codename: 'BENCH-04',
        preferredProviders: ['hackernews-signals', 'public-feed-signals'],
        queries: [
          normalizedFocus ? `${normalizedFocus} pricing benchmark` : 'freelance consulting rates benchmark',
          'SaaS unit economics margins',
        ],
        freshnessWindowHours: 720, // 30 days
        maxResults: 6,
        intentSummary: 'Ground hourly dollar yield, pricing tiers, and margin structures in public industry benchmarks.',
      };
    }

    case 'growth-strategist':
    case 'GROWTH-05': {
      return {
        agentId: 'growth-strategist',
        codename: 'GROWTH-05',
        preferredProviders: ['hackernews-signals', 'public-feed-signals', 'remoteok-jobs'],
        queries: [
          normalizedFocus ? `${normalizedFocus} organic distribution` : 'zero budget distribution cold outreach',
          'growth case study organic traffic',
        ],
        freshnessWindowHours: 168,
        maxResults: 6,
        intentSummary: 'Map verified zero-budget distribution hooks, organic reach strategies, and personalized diagnostic angles.',
      };
    }

    case 'skill-compounder':
    case 'COMPOUND-06': {
      return {
        agentId: 'skill-compounder',
        codename: 'COMPOUND-06',
        preferredProviders: ['github-repositories', 'hackernews-signals'],
        queries: [
          normalizedFocus ? `${normalizedFocus} agent template` : 'agent workflow SDK templates',
          'prompt engineering reusable framework',
        ],
        freshnessWindowHours: 168,
        maxResults: 6,
        intentSummary: 'Extract modular SOP patterns, open-source prompt chains, and reusable IP architectures.',
      };
    }

    case 'chief-of-staff':
    case 'AXIS-07':
    default: {
      return {
        agentId: 'chief-of-staff',
        codename: 'AXIS-07',
        preferredProviders: ['hackernews-signals'],
        queries: ['operating rhythm execution priorities'],
        freshnessWindowHours: 72,
        maxResults: 4,
        intentSummary: 'Synthesize internal evidence from upstream runs into a single non-branching 14-day path.',
      };
    }
  }
}

function extractKeywords(input: string, candidates: string[]): string | null {
  const lower = input.toLowerCase();
  for (const c of candidates) {
    if (lower.includes(c)) return c;
  }
  return null;
}
