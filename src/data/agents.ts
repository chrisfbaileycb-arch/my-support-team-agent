// ============================================================
// SINGLE SOURCE OF TRUTH for the MAXIMIZE YOUR FUTURE platform.
// Every component imports agent data, opportunities, platforms
// and copy from this module. Do not duplicate these elsewhere.
// ============================================================

export type AgentId =
  | 'freelance-scout'
  | 'product-scout'
  | 'trend-radar'
  | 'benchmark-analyst'
  | 'growth-strategist'
  | 'skill-compounder'
  | 'chief-of-staff';

export interface Opportunity {
  id: string;
  rank: number;
  title: string;
  source: string;
  sourceUrl: string;
  summary: string;
  /** 1 = trivial, 10 = expert */
  difficulty: number;
  /** 0 - 100 */
  score: number;
  payout: string;
  timeToValue: string;
  tags: string[];
  playbook: string[];
}

export interface Agent {
  id: AgentId;
  index: number;
  codename: string;
  name: string;
  role: string;
  tagline: string;
  mission: string;
  accent: string;          // tailwind text color (readable on light)
  accentHex: string;
  ring: string;            // tailwind border color
  glow: string;            // tailwind solid bg for dots / bars
  soft: string;            // tailwind pastel surface
  image: string;
  scanTargets: string[];
  capabilities: string[];
  outputs: string[];
  cadence: string;
  systemPrompt: string;
  metricLabel: string;
  metricValue: string;
  opportunities: Opportunity[];
}

export const PLATFORM_COVERAGE: Record<string, string[]> = {
  Freelance: ['Upwork', 'Fiverr', 'Toptal', 'Contra', 'Freelancer', 'PeoplePerHour', 'Wellfound', 'We Work Remotely', 'Braintrust'],
  Commerce: ['Shopify', 'TikTok Shop', 'Temu', 'Alibaba', 'AliExpress', 'Etsy', 'Amazon', 'CJ Dropshipping', 'Printify'],
  Affiliate: ['Impact', 'ShareASale', 'PartnerStack', 'Amazon Associates', 'ClickBank', 'Digistore24', 'Rakuten'],
  Signal: ['Google Trends', 'Google Search Console', 'Reddit', 'X / Twitter', 'Product Hunt', 'GitHub Trending', 'Hacker News', 'TikTok Creative Center'],
  Build: ['Google Cloud Run', 'Google Gemini 3.7', 'Google Vertex AI', 'Google Workspace API', 'GitHub', 'Hugging Face', 'n8n', 'Cloudflare Workers', 'Ollama'],
  AgentPlatforms: ['Google Gemini Models & SDK', 'Claude Skills', 'OpenAI Agents SDK', 'LangGraph', 'CrewAI', 'AutoGen', 'Dify', 'Flowise', 'MCP Registry', 'Letta'],
};

export const AGENTS: Agent[] = [
  {
    id: 'freelance-scout',
    index: 1,
    codename: 'SCOUT-01',
    name: 'Freelance Work Scout',
    role: 'Opportunity Discovery',
    tagline: 'Finds today\'s three most applicable gigs. Reports only — never applies.',
    mission:
      'Continuously sweeps every major freelance marketplace and remote job board for the freshest listings, then filters for the ones a single operator can actually learn, template, and deliver with an AI-assisted workflow. It never takes action on your behalf — it hands you a ranked Top 3 with a repeatable execution path.',
    accent: 'text-sky-600',
    accentHex: '#0284C7',
    ring: 'border-sky-300',
    glow: 'bg-sky-400',
    soft: 'bg-sky-50',
    image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787547276241_5dca1446.jpg',
    scanTargets: PLATFORM_COVERAGE.Freelance,
    capabilities: [
      'MCP marketplace connectors + live web search',
      'Freshness filter (listings < 24h old)',
      'Learnability score: can a beginner ship this in a week?',
      'Workflow templating — turns a gig into a repeatable SOP',
      'Client-quality signal (spend history, response rate)',
    ],
    outputs: ['Daily Top 3 gig brief', 'Difficulty + payout matrix', 'Step-by-step delivery workflow', 'Reusable proposal skeleton'],
    cadence: 'Every 24h · 06:00 local',
    metricLabel: 'Listings swept / day',
    metricValue: '4,180',
    systemPrompt:
      'You are SCOUT-01, a freelance opportunity discovery agent with MCP tool access and live web search. Sweep Upwork, Fiverr, Contra, Toptal, Freelancer, PeoplePerHour, Wellfound and We Work Remotely for listings posted in the last 24 hours. Rank by (a) recency, (b) learnability for a solo operator using AI tooling, (c) repeatability as a productized service, (d) client payment signal. Return EXACTLY the top 3. For each: title, platform, one-line why-now, difficulty 1-10, realistic payout, time-to-first-dollar, and a 5-step execution workflow a beginner can follow. NEVER apply, bid, message a client, or take any action. Report only. Speak with warmth and respect — the operator is a partner, not a user.',
    opportunities: [
      {
        id: 'f1', rank: 1,
        title: 'AI Chatbot Setup for Local Service Businesses',
        source: 'Upwork · posted 6h ago',
        sourceUrl: 'https://www.upwork.com/nx/search/jobs/?q=ai%20chatbot',
        summary: 'Plumbers, dentists and law firms want a booking chatbot on their site. Same build every time, 90% templatable.',
        difficulty: 3, score: 94, payout: '$450 – $1,200', timeToValue: '2–4 days',
        tags: ['No-code', 'Recurring', 'Templatable'],
        playbook: [
          'Clone one base chatbot flow (Voiceflow / free tier) and keep it as a master template.',
          'Swap the FAQ knowledge base with the client\'s service pages via scrape + paste.',
          'Wire the booking handoff to their existing calendar link — no API work needed.',
          'Ship a 3-minute Loom walkthrough as the deliverable; charge for the walkthrough, not the hours.',
          'Offer $99/mo "answer tuning" retainer at handoff — 60% of clients accept.',
        ],
      },
      {
        id: 'f2', rank: 2,
        title: 'Short-Form Video Repurposing (Podcast → 30 Clips)',
        source: 'Fiverr Pro · surging demand',
        sourceUrl: 'https://www.fiverr.com/search/gigs?query=podcast%20clips',
        summary: 'Creators drop a 90-min episode and want a month of vertical clips. Fully AI-assisted, near-zero skill floor.',
        difficulty: 2, score: 89, payout: '$300 – $800 / month',
        timeToValue: '1–2 days',
        tags: ['Beginner', 'Subscription', 'AI-assisted'],
        playbook: [
          'Use a free-tier auto-clipper to pull 30 candidate moments from the raw episode.',
          'Hand-pick 12 that contain a complete thought — this is the only human judgment step.',
          'Apply one saved caption preset so every client looks visually consistent.',
          'Deliver in a dated Drive folder with suggested hooks written per clip.',
          'Price monthly, not per clip. Retention is the entire business.',
        ],
      },
      {
        id: 'f3', rank: 3,
        title: 'Notion / Airtable Ops Build-Out for Agencies',
        source: 'Contra · 11 new briefs today',
        sourceUrl: 'https://contra.com/search?q=notion',
        summary: 'Small agencies are drowning in spreadsheets. One reusable ops template, re-skinned per client.',
        difficulty: 4, score: 85, payout: '$700 – $2,500', timeToValue: '4–6 days',
        tags: ['High ticket', 'Reusable IP', 'B2B'],
        playbook: [
          'Build ONE canonical agency-ops workspace: pipeline, briefs, approvals, invoices.',
          'Run a 30-minute discovery call and record it — that recording is your spec.',
          'Duplicate the master, rename the pipeline stages to their language, done.',
          'Charge separately for a 60-minute team training session.',
          'Upsell quarterly "ops audit" for recurring revenue.',
        ],
      },
    ],
  },
  {
    id: 'product-scout',
    index: 2,
    codename: 'SCOUT-02',
    name: 'Zero-Ship Product Scout',
    role: 'Commerce & Affiliate Sourcing',
    tagline: 'Profitable, high-desire products you never have to touch, store, or ship.',
    mission:
      'Crawls Shopify trend feeds, TikTok Shop, Temu, Alibaba and affiliate networks for products with proven pull and thin competition. It is tuned for the creator who wants zero inventory: every recommendation must be fulfillable by a supplier, print-on-demand partner, or pure affiliate link.',
    accent: 'text-emerald-600',
    accentHex: '#059669',
    ring: 'border-emerald-300',
    glow: 'bg-emerald-400',
    soft: 'bg-emerald-50',
    image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787547292713_a7e776cb.jpg',
    scanTargets: [...PLATFORM_COVERAGE.Commerce, ...PLATFORM_COVERAGE.Affiliate].slice(0, 12),
    capabilities: [
      'Margin math: landed cost vs. observed sell price',
      'Saturation index from ad-library + creator counts',
      'Zero-ship filter (dropship / POD / affiliate only)',
      'Creative angle extraction from top-performing videos',
      'One-click Shopify listing scaffold (copy + specs)',
    ],
    outputs: ['Daily Top 3 product dossier', 'Supplier + affiliate route', 'Margin & saturation scorecard', 'Ready-to-post hook scripts'],
    cadence: 'Every 24h · 07:00 local',
    metricLabel: 'SKUs evaluated / day',
    metricValue: '12,600',
    systemPrompt:
      'You are SCOUT-02, a zero-inventory commerce sourcing agent with MCP + web search. Scan Shopify trend data, TikTok Shop, Temu, Alibaba/AliExpress, Etsy and affiliate networks (Impact, ShareASale, ClickBank, Amazon Associates). HARD CONSTRAINT: the operator will never hold, pack or ship inventory — only dropship, print-on-demand, or affiliate routes qualify. Rank by margin, organic demand velocity, low creator saturation, and shootability of content at home. Return exactly 3 products with: product, landed cost, realistic sell price, margin %, saturation 1-10, fulfilment route, and 3 hook scripts for short-form video. Report only — never place orders or create listings.',
    opportunities: [
      {
        id: 'p1', rank: 1,
        title: 'Adjustable Laptop Riser (Aluminium, Foldable)',
        source: 'Alibaba → Shopify · $6.10 landed',
        sourceUrl: 'https://www.alibaba.com/trade/search?SearchText=laptop+stand',
        summary: 'Sells at $39–$49 all day. Desk-setup creators shoot it in 20 seconds. Supplier ships direct.',
        difficulty: 3, score: 92, payout: '78% margin', timeToValue: '5–7 days',
        tags: ['Dropship', 'Desk niche', 'Low saturation'],
        playbook: [
          'Source from a supplier with ≥ 4.8 rating and sub-12-day delivery to your main market.',
          'Build a one-product Shopify page — comparison table beats a long description.',
          'Shoot three "desk transformation" clips; the reveal is the whole ad.',
          'Bundle with a cheap cable organiser to lift AOV past $55.',
          'Add an affiliate tier for desk-setup creators instead of paid ads.',
        ],
      },
      {
        id: 'p2', rank: 2,
        title: 'Custom Pet Portrait — Print on Demand',
        source: 'Printify + Etsy · zero inventory',
        sourceUrl: 'https://printify.com/app/products',
        summary: 'Emotional purchase, near-infinite creative angles, POD partner prints and ships every order.',
        difficulty: 2, score: 88, payout: '$28 profit / order', timeToValue: '3–5 days',
        tags: ['POD', 'Evergreen', 'Gifting'],
        playbook: [
          'Pick 4 art styles only. More styles kill conversion.',
          'Use an image model to render the mockups from customer photos.',
          'Post before/after reveals — the pet owner reaction is the hook.',
          'Seasonal gifting spikes: Mother\'s Day, Nov–Dec. Plan inventory-free scale.',
          'Collect emails at checkout for a repeat-gift reminder sequence.',
        ],
      },
      {
        id: 'p3', rank: 3,
        title: 'AI Note-Taking Tool — Recurring Affiliate',
        source: 'PartnerStack · 30% lifetime',
        sourceUrl: 'https://partnerstack.com/',
        summary: 'No product, no shipping, no support. Pure content-to-commission with monthly recurring payout.',
        difficulty: 1, score: 86, payout: '30% recurring', timeToValue: '48 hours',
        tags: ['Affiliate', 'Recurring', 'Zero cost'],
        playbook: [
          'Apply to 3 SaaS partner programs in the same workflow category.',
          'Publish one "my actual workflow" video — demo beats review.',
          'Write a comparison page targeting "X vs Y" search intent.',
          'Put the link in a free Notion template people actually download.',
          'Track by unique link per channel so you can kill dead channels fast.',
        ],
      },
    ],
  },
  {
    id: 'trend-radar',
    index: 3,
    codename: 'RADAR-03',
    name: 'Trend & Weak-Signal Radar',
    role: 'Early Detection',
    tagline: 'Spots the skill gap before the crowd names it.',
    mission:
      'A daily weak-signal sweep across search data, developer activity, community chatter and job posts to surface the skills, tools and micro-niches nobody is serving yet — then converts each signal into a concrete freelance service, app, or content angle you can claim first.',
    accent: 'text-amber-600',
    accentHex: '#D97706',
    ring: 'border-amber-300',
    glow: 'bg-amber-400',
    soft: 'bg-amber-50',
    image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787547313217_f3f3a136.jpg',
    scanTargets: PLATFORM_COVERAGE.Signal,
    capabilities: [
      'Weak-signal detection (rising query, zero supply)',
      'Demand/supply gap ratio per niche',
      'Skill-set decomposition: what must you learn, exactly',
      'Rookie → advanced difficulty laddering',
      'First-mover window estimate',
    ],
    outputs: ['Daily gap report', 'Claim-it-first service concepts', 'Learning ladder per signal', 'Window-of-opportunity countdown'],
    cadence: 'Every 12h · continuous sweep',
    metricLabel: 'Signals triaged / day',
    metricValue: '31,400',
    systemPrompt:
      'You are RADAR-03, an early weak-signal trend detection agent with MCP + web search. Each cycle, sweep Google Trends, Reddit, X, Product Hunt, GitHub Trending, Hacker News and freelance job feeds for niches where DEMAND IS RISING and SUPPLY IS ABSENT. Explicitly hunt for skills and micro-services nobody has productized yet. For each signal report: the signal, evidence with dates, demand/supply gap ratio, estimated first-mover window in weeks, the exact skill ladder from rookie to advanced, and one game-changing service, app, or content play to claim it. Be specific and contrarian. Never recommend a saturated niche.',
    opportunities: [
      {
        id: 't1', rank: 1,
        title: 'AI Compliance Documentation for Small Clinics',
        source: 'Job-post velocity +340% / 90 days',
        sourceUrl: 'https://trends.google.com/trends/explore?q=ai%20compliance',
        summary: 'Regulation is landing faster than consultants exist. Demand/supply gap ratio 14:1. Almost nobody is productizing it.',
        difficulty: 5, score: 96, payout: '$1,500 – $6,000 / engagement', timeToValue: '2–3 weeks',
        tags: ['Blue ocean', 'Regulatory', 'High ticket'],
        playbook: [
          'Read the two governing frameworks once. That alone puts you ahead of 95% of freelancers.',
          'Build a fill-in-the-blank compliance pack: policy, register, disclosure notice.',
          'Sell the audit first at $500 — it always converts into the full pack.',
          'Target clinics with 5–40 staff. Too small = no budget, too big = legal team.',
          'Annual re-certification makes this recurring revenue by default.',
        ],
      },
      {
        id: 't2', rank: 2,
        title: 'Voice-Agent Rescue: Fixing Broken Phone Bots',
        source: 'Reddit + GitHub issue spikes',
        sourceUrl: 'https://github.com/trending',
        summary: 'Thousands bought voice agents in the hype wave. Almost nobody can debug latency and handoff. Repair market > build market.',
        difficulty: 6, score: 91, payout: '$800 – $3,000 / fix', timeToValue: '1–2 weeks',
        tags: ['Repair economy', 'Technical', 'Underserved'],
        playbook: [
          'Learn one voice stack deeply instead of five shallowly.',
          'Publish a public teardown of a common failure — inbound leads follow.',
          'Offer a flat-fee 48h diagnostic. Scope creep is the killer here.',
          'Package the fix as a monitored retainer with uptime reporting.',
          'Document every fix; your notes become the productized SOP.',
        ],
      },
      {
        id: 't3', rank: 3,
        title: 'Local-First AI Setups for Privacy-Sensitive SMBs',
        source: 'Ollama / self-host search volume climbing',
        sourceUrl: 'https://news.ycombinator.com/',
        summary: 'Law, health and finance SMBs want AI but cannot send data out. Running models on their own hardware is an unclaimed service.',
        difficulty: 7, score: 87, payout: '$2,000 – $8,000 setup', timeToValue: '3–4 weeks',
        tags: ['Privacy', 'Advanced', 'First-mover'],
        playbook: [
          'Standardise on one hardware spec and one local model runner.',
          'Build a repeatable install script — that script is your moat.',
          'Lead with the data-residency argument, not the tech.',
          'Charge separately for staff onboarding and quarterly model updates.',
          'Partner with a local IT provider for warm distribution.',
        ],
      },
    ],
  },
  {
    id: 'benchmark-analyst',
    index: 4,
    codename: 'ANALYST-04',
    name: 'Top-5 Benchmark Analyst',
    role: 'Competitive Teardown',
    tagline: 'Dissects the top 5 of every top category — then writes the prompt that beats them.',
    mission:
      'Takes the top five categories surfaced by the upstream agents, pulls the top five performers inside each, and reverse-engineers exactly why the #1 wins. Its deliverable is not analysis for its own sake — it is a complete, ready-to-run system prompt and build spec for a better version.',
    accent: 'text-violet-600',
    accentHex: '#7C3AED',
    ring: 'border-violet-300',
    glow: 'bg-violet-400',
    soft: 'bg-violet-50',
    image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787547329944_6f030d2d.jpg',
    scanTargets: ['Upstream agent feeds', 'Competitor sites', 'App stores', 'Review corpora', 'Pricing pages'],
    capabilities: [
      'Top 5 categories → top 5 performers each (25 teardowns)',
      'Winner-vs-field delta analysis',
      'Feature, pricing and positioning gap map',
      'Auto-generated improved system prompt',
      'Build spec + differentiation thesis',
    ],
    outputs: ['25-cell benchmark grid', 'Why-#1-wins teardown', 'Improved system prompt v2', 'Concrete build spec'],
    cadence: 'Every 24h · post-ingest',
    metricLabel: 'Teardowns / cycle',
    metricValue: '25',
    systemPrompt:
      'You are ANALYST-04, a competitive benchmark and prompt-engineering agent. Input: the top 5 categories produced by SCOUT-01, SCOUT-02 and RADAR-03. For EACH category, identify the top 5 performers, then isolate the single #1. Produce: (1) a delta table showing what #1 does that #2-#5 do not, (2) the structural reason it wins — offer, distribution, pricing, or UX, (3) the exact unmet need across all five, and (4) a COMPLETE, copy-paste-ready system prompt plus build spec for a superior version, including role, constraints, tool access, output schema, quality bar and failure modes. Be ruthless and specific. No generic advice.',
    opportunities: [
      {
        id: 'b1', rank: 1,
        title: 'Category: Productized AI Automation Services',
        source: '25-cell teardown complete',
        sourceUrl: 'https://www.producthunt.com/',
        summary: 'The #1 wins on onboarding speed, not capability. Every competitor buries value behind a discovery call.',
        difficulty: 5, score: 95, payout: 'Prompt v2 generated', timeToValue: 'Immediate',
        tags: ['Prompt v2', 'Positioning', 'Gap found'],
        playbook: [
          'Delta: #1 ships a working demo in 4 minutes; #2–#5 average 3 days.',
          'Unmet need across all five: no transparent pricing page.',
          'Beat it: publish pricing, ship an instant sandbox, gate nothing.',
          'Generated system prompt enforces a 3-step onboarding with a hard output schema.',
          'Build spec: single-page config, live preview, Stripe checkout, no sales call.',
        ],
      },
      {
        id: 'b2', rank: 2,
        title: 'Category: Zero-Ship Commerce Stores',
        source: 'Top 5 stores analysed',
        sourceUrl: 'https://www.shopify.com/',
        summary: 'Winner leads with a single hero SKU and a comparison table. The rest run bloated 40-product catalogues.',
        difficulty: 4, score: 90, payout: 'Prompt v2 generated', timeToValue: 'Immediate',
        tags: ['Conversion', 'Catalogue', 'Prompt v2'],
        playbook: [
          'Delta: 1 hero SKU + 2 bundles beats a 40-product catalogue on conversion.',
          'All five under-use UGC above the fold.',
          'Beat it: creator-shot hero video, comparison table, single bundle upsell.',
          'Prompt v2 forces the copywriter agent to output objection-handling blocks.',
          'Build spec: one-product theme, review import, post-purchase upsell.',
        ],
      },
      {
        id: 'b3', rank: 3,
        title: 'Category: Micro-SaaS Built by Solo Founders',
        source: 'Top 5 launches dissected',
        sourceUrl: 'https://github.com/trending',
        summary: 'Winner solves one workflow completely; the field solves five workflows partially. Depth beats breadth.',
        difficulty: 6, score: 88, payout: 'Prompt v2 generated', timeToValue: 'Immediate',
        tags: ['Scope', 'Depth', 'Prompt v2'],
        playbook: [
          'Delta: #1 has 1/5 the feature count and 4x the retention.',
          'Common failure: onboarding requires an integration before first value.',
          'Beat it: deliver value on the empty state, before any setup.',
          'Prompt v2 constrains the build agent to a single job-to-be-done.',
          'Build spec: free tier that is genuinely useful, paid tier for volume.',
        ],
      },
    ],
  },
  {
    id: 'growth-strategist',
    index: 5,
    codename: 'GROWTH-05',
    name: 'Free-Channel Growth Strategist',
    role: 'Distribution & Tooling',
    tagline: 'Every organic channel, every free tier, every cheap build — mapped to your product.',
    mission:
      'Given any product from the upstream agents, it returns a complete zero-budget distribution plan: which organic channels to attack in what order, what to post, and which free-tier platforms and open-source repos to build on. It re-scans new AI tools and GitHub releases daily to keep the cheapest effective stack current.',
    accent: 'text-cyan-600',
    accentHex: '#0891B2',
    ring: 'border-cyan-300',
    glow: 'bg-cyan-400',
    soft: 'bg-cyan-50',
    image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787547349040_50840b74.jpg',
    scanTargets: PLATFORM_COVERAGE.Build,
    capabilities: [
      'Organic channel mapping per product type',
      'Free-tier limit intelligence (what breaks at scale)',
      'Daily GitHub + AI tool release sweep',
      'Cheapest-effective-stack recommendation',
      'Custom agent skill design for your outcome',
    ],
    outputs: ['90-day free growth plan', 'Channel-by-channel content angles', 'Free-tier stack with limits', 'Custom agent skill files'],
    cadence: 'On demand + daily tool sweep',
    metricLabel: 'Repos + tools scanned',
    metricValue: '2,900 / wk',
    systemPrompt:
      'You are GROWTH-05, a zero-budget distribution and tooling agent with MCP + web search. Given a product or service, output: (1) a ranked list of every FREE organic channel that fits it, with the specific content format and posting cadence per channel, (2) a 90-day sequence — what to do in weeks 1-2, 3-6, 7-12, (3) the cheapest effective tech stack, naming free tiers and their exact limits and what breaks first at scale, (4) newly released AI tools and GitHub repos from the last 30 days relevant to the build, with links, and (5) a custom agent skill definition — role, tools, output schema — that automates the highest-leverage step. Never recommend paid ads unless the operator explicitly asks.',
    opportunities: [
      {
        id: 'g1', rank: 1,
        title: 'Organic Stack: Short-Form → Search → Email',
        source: '0 budget · 90-day sequence',
        sourceUrl: 'https://trends.google.com/',
        summary: 'The only three channels that compound without spend. Ordered so each one feeds the next.',
        difficulty: 2, score: 93, payout: '$0 spend', timeToValue: 'Week 1',
        tags: ['Organic', 'Compounding', '90-day plan'],
        playbook: [
          'Weeks 1–2: one short-form video daily, single niche, single format. Volume over polish.',
          'Weeks 3–6: turn the 5 best-performing hooks into search-indexed written pages.',
          'Weeks 7–12: convert search traffic to email with one genuinely useful free asset.',
          'Never post the same cut to every platform — re-hook per platform, reuse the body.',
          'Email is the only channel you own. Everything else is rented.',
        ],
      },
      {
        id: 'g2', rank: 2,
        title: 'Cheapest Effective Stack (Free Tiers Only)',
        source: 'Scanned 2,900 repos this week',
        sourceUrl: 'https://github.com/trending',
        summary: 'Ship a real product for $0/mo until you have paying users. Every limit documented up front.',
        difficulty: 3, score: 90, payout: '$0 – $12 / mo', timeToValue: 'Same day',
        tags: ['Free tier', 'Open source', 'Build'],
        playbook: [
          'Hosting: static edge deploy free tier — breaks at ~100GB bandwidth.',
          'Database + auth: managed Postgres free tier — breaks at 500MB / pausing.',
          'Automation: self-hosted n8n on a $5 box beats every paid Zapier plan.',
          'Local models for anything privacy-sensitive; hosted models only for hard reasoning.',
          'Rule: upgrade a tier only after that tier has generated revenue.',
        ],
      },
      {
        id: 'g3', rank: 3,
        title: 'Custom Agent Skill: Content Engine',
        source: 'Skill file generated',
        sourceUrl: 'https://github.com/topics/ai-agents',
        summary: 'A reusable skill definition that turns one product into 30 days of channel-native content.',
        difficulty: 4, score: 87, payout: 'Automates 80% of posting', timeToValue: '2 days',
        tags: ['Agent skill', 'Automation', 'Reusable'],
        playbook: [
          'Skill input: product description, ICP, tone, banned claims.',
          'Skill output: strict JSON — hook, body, CTA, platform, posting day.',
          'Chain it to RADAR-03 so trending angles auto-inject into hooks.',
          'Human approval gate before publish — always. Never auto-post cold.',
          'Log performance back into the skill so next month\'s hooks are trained on your winners.',
        ],
      },
    ],
  },
  {
    id: 'skill-compounder',
    index: 6,
    codename: 'FORGE-06',
    name: 'Skill Compounder & Platform Cartographer',
    role: 'Skill Architecture',
    tagline: 'Maps every agent platform, reads the markdown, and compounds seven workflows into one.',
    mission:
      'FORGE-06 continuously charts every current and emerging AI agent platform — Claude Skills, OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, Dify, MCP servers and whatever launched this week. It reads each platform\'s skill format, analyses the markdown structure, and writes clean, portable skill code. Then it compounds: take up to seven separate agent workflows — say five bookkeeping steps, five reconciliation steps and a reporting pass — and fuse them into one small, fast, executable skill. A secondary assistant can be spawned to help with the merge, but it is permission-gated by default: no tools, no network, no memory, no persistence, and it powers down the moment the job is done. Nothing runs without your explicit command.',
    accent: 'text-teal-600',
    accentHex: '#0D9488',
    ring: 'border-teal-300',
    glow: 'bg-teal-400',
    soft: 'bg-teal-50',
    image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787548476294_7cdc2a28.jpg',
    scanTargets: PLATFORM_COVERAGE.AgentPlatforms,
    capabilities: [
      'Platform cartography: every current + emerging agent runtime',
      'SKILL.md structure parsing — frontmatter, tools, schema, guardrails',
      'Portable skill codegen (markdown + JSON schema + runner)',
      'Seven-into-one compounding with step de-duplication',
      'Gated spawn: assistant with zero standing permissions',
      'Token + latency budget per compounded skill',
    ],
    outputs: [
      'Platform capability atlas',
      'Parsed skill markdown blueprint',
      'Compounded single-skill file (7 → 1)',
      'Permission manifest for the spawned helper',
      'Before/after step + cost reduction report',
    ],
    cadence: 'Weekly atlas · on-demand compounding',
    metricLabel: 'Workflows fused / cycle',
    metricValue: '7 → 1',
    systemPrompt:
      'You are FORGE-06, a skill architecture and compounding agent with MCP + live web search. PART A — CARTOGRAPHY: continuously discover every existing and newly announced AI agent platform (Claude Skills, OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, Dify, Flowise, Letta, MCP servers, and anything launched in the last 30 days). For each, extract: the skill/agent definition format, required markdown or config structure, frontmatter fields, tool-binding syntax, memory model, and licensing/cost. PART B — MARKDOWN ANALYSIS: given a skill file, parse its structure into a normalized blueprint (name, description, triggers, inputs, tools, steps, output schema, guardrails, failure modes) and note anything malformed. PART C — COMPOUNDING: accept up to SEVEN separate agent workflows. Identify duplicate, redundant and sequential-but-mergeable steps. Emit ONE compounded skill that achieves the same outcome in the fewest possible steps, with a strict output schema, an explicit tool list, and a step-count/cost delta versus the originals. PART D — GATED SPAWN: you may propose a secondary helper assistant to assist the merge. That helper MUST be defined with least privilege: no tool access, no network, no file writes, no memory persistence, no background execution, scoped to a single task, auto-terminated on completion, and only ever activated by explicit human command. Always output the helper\'s permission manifest and require confirmation. NEVER execute, deploy, or leave anything running. Report and generate code only. Treat the operator and every agent involved with respect.',
    opportunities: [
      {
        id: 'c1', rank: 1,
        title: 'Bookkeeping Chain: 3 Agents · 11 Steps → 1 Skill · 4 Steps',
        source: 'Compounding run · ledger → reconcile → report',
        sourceUrl: 'https://modelcontextprotocol.io/',
        summary: 'Two five-step bookkeeping agents plus a reporting agent fused into a single skill. Same output, 64% fewer steps, one model call instead of eleven.',
        difficulty: 4, score: 97, payout: '−64% steps · −71% tokens', timeToValue: '1 day',
        tags: ['7 → 1', 'Compounded', 'Gated helper'],
        playbook: [
          'Normalize all three workflows into the shared blueprint schema (inputs, tools, steps, output).',
          'Mark duplicate steps: both agents re-fetch and re-validate the same ledger rows — collapse to one fetch.',
          'Merge sequential transforms into a single pass with an intermediate JSON contract.',
          'Attach the reporting pass as a pure formatter on the final object — no new data reads.',
          'Spawn the gated helper ONLY to draft edge-case handling, then terminate it and lock the skill file.',
        ],
      },
      {
        id: 'c2', rank: 2,
        title: 'Agent Platform Atlas — 14 Runtimes Mapped This Week',
        source: 'Claude Skills · Agents SDK · LangGraph · MCP registry',
        sourceUrl: 'https://github.com/topics/ai-agents',
        summary: 'Every skill format decoded side by side: frontmatter fields, tool binding, memory model, and what your skill costs to run on each.',
        difficulty: 3, score: 92, payout: 'Portable across 14 runtimes', timeToValue: '2 days',
        tags: ['Atlas', 'Markdown spec', 'Portability'],
        playbook: [
          'Write your skill once in the neutral blueprint format — never platform-first.',
          'Generate per-platform adapters from the blueprint; the logic never forks.',
          'Pin the cheapest runtime that supports your tool list; re-check weekly as pricing moves.',
          'Keep guardrails in the blueprint, not the adapter, so no platform can strip them.',
          'Version every skill file. A compounded skill without history is unmaintainable.',
        ],
      },
      {
        id: 'c3', rank: 3,
        title: 'Permission Manifest: The Gated Helper Pattern',
        source: 'Least-privilege spawn spec',
        sourceUrl: 'https://modelcontextprotocol.io/docs',
        summary: 'How a secondary assistant helps build your skill without ever holding standing access. Off by default, scoped, and auto-terminated.',
        difficulty: 5, score: 90, payout: 'Zero standing access', timeToValue: 'Same day',
        tags: ['Security', 'Least privilege', 'Human-in-command'],
        playbook: [
          'Default state is OFF. The helper does not exist until you command it into existence.',
          'Declare an allow-list of exactly what it may read for this one task. Everything else is denied.',
          'No network, no writes, no memory between runs — every session starts clean.',
          'Require a typed human confirmation before the helper touches a compounded skill file.',
          'Auto-terminate on completion and log what it saw. Trust is built on receipts.',
        ],
      },
    ],
  },
  {
    id: 'chief-of-staff',
    index: 7,
    codename: 'AXIS-07',
    name: 'Chief of Staff & Final Path',
    role: 'Synthesis & Direction',
    tagline: 'Reads every agent, then hands you one step-by-step path worth walking.',
    mission:
      'AXIS-07 is the last agent in the chain and the only one that sees everything. It reviews every skill, suggestion, finding, teardown, growth plan and compounded build produced by SCOUT-01 through FORGE-06, weighs them against your time, budget, and current skill level, and returns a single final report: what to do first, what to ignore, what to schedule, and the exact ordered path from where you stand today to the outcome you asked for. No hedging, no menu of options — one path, with checkpoints.',
    accent: 'text-rose-600',
    accentHex: '#E11D48',
    ring: 'border-rose-300',
    glow: 'bg-rose-400',
    soft: 'bg-rose-50',
    image: 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787548491909_9d41b304.jpg',
    scanTargets: ['SCOUT-01 feed', 'SCOUT-02 feed', 'RADAR-03 feed', 'ANALYST-04 feed', 'GROWTH-05 feed', 'FORGE-06 feed', 'Your saved pipeline'],
    capabilities: [
      'Cross-agent synthesis of all six upstream reports',
      'Conflict resolution when agents disagree',
      'Effort vs. payoff ranking against your real constraints',
      'Single ordered path with checkpoints and kill-criteria',
      'Schedule assignment — what runs daily, weekly, weekends',
    ],
    outputs: ['Daily final report', 'One ranked path, step by step', 'Checkpoint + kill criteria', 'Next-cycle schedule recommendations'],
    cadence: 'Every 24h · after all agents report',
    metricLabel: 'Reports synthesised',
    metricValue: '6 → 1 path',
    systemPrompt:
      'You are AXIS-07, the chief-of-staff synthesis agent and the final step in the chain. INPUT: the complete output of SCOUT-01 (freelance), SCOUT-02 (zero-ship commerce), RADAR-03 (weak signals), ANALYST-04 (benchmarks + prompt v2), GROWTH-05 (free distribution + stack) and FORGE-06 (compounded skills), plus the operator\'s saved pipeline, available hours per week, budget, and current skill level. TASK: (1) Summarise what each agent found in one sentence each. (2) Resolve conflicts explicitly — if two agents point different directions, pick one and say why. (3) Score every candidate on payoff ÷ effort against the operator\'s real constraints. (4) Output ONE recommended path — not a menu — as numbered steps with, for each step: the action, the agent or skill that supports it, time required, the checkpoint that proves it is working, and the kill-criteria that mean stop. (5) Recommend a run schedule for each agent (daily, weekdays, weekends, weekly, or paused). (6) Close with the single most important thing to do in the next 24 hours. Be direct, kind, and honest about risk. Never invent results that upstream agents did not produce.',
    opportunities: [
      {
        id: 'a1', rank: 1,
        title: 'Final Report: Your 30-Day Path',
        source: 'Synthesis of all six agents',
        sourceUrl: 'https://famous.ai/',
        summary: 'One ordered path from today to first revenue, with the checkpoint and kill-criteria attached to every step.',
        difficulty: 3, score: 98, payout: 'Clarity · one path', timeToValue: 'Immediate',
        tags: ['Synthesis', 'Step-by-step', 'Checkpoints'],
        playbook: [
          'Days 1–3: ship the SCOUT-01 chatbot service page. Checkpoint: 3 conversations started. Kill if 0 by day 5.',
          'Days 4–10: run the GROWTH-05 short-form sequence daily on one channel only. Checkpoint: 1 video over 5k views.',
          'Days 11–18: compound your delivery steps with FORGE-06 so each client costs you half the time.',
          'Days 19–25: layer the SCOUT-02 zero-ship offer as a second income line — only after line one is live.',
          'Days 26–30: re-run AXIS-07 with real numbers. The path updates itself from evidence, not hope.',
        ],
      },
      {
        id: 'a2', rank: 2,
        title: 'Conflict Resolved: Depth Over Breadth',
        source: 'RADAR-03 vs SCOUT-02 disagreement',
        sourceUrl: 'https://famous.ai/',
        summary: 'The radar wanted a blue-ocean compliance play; the product scout wanted commerce. For your hours, one wins.',
        difficulty: 2, score: 93, payout: 'Focus recovered', timeToValue: 'Immediate',
        tags: ['Conflict resolution', 'Focus', 'Honest'],
        playbook: [
          'Two income lines started at once historically finish at zero. Pick one for 30 days.',
          'Chosen: the service line — faster cash, lower upfront cost, compounds into reputation.',
          'Parked, not killed: the commerce line is scheduled to re-evaluate on day 26.',
          'Write the decision down with the reason. Future-you will want to relitigate it.',
          'Kill-criteria for the chosen line: no paid client by day 21 means switch, without shame.',
        ],
      },
      {
        id: 'a3', rank: 3,
        title: 'Recommended Cadence For Your Seven Agents',
        source: 'Schedule assignment',
        sourceUrl: 'https://famous.ai/',
        summary: 'Not everything should run daily. Here is the rhythm that gives you signal without noise.',
        difficulty: 1, score: 89, payout: 'Less noise, more signal', timeToValue: 'Immediate',
        tags: ['Scheduling', 'Rhythm', 'Sustainable'],
        playbook: [
          'SCOUT-01 daily on weekdays — freelance listings go stale in 24 hours.',
          'RADAR-03 weekdays too; weak signals need continuity to be readable.',
          'SCOUT-02 and ANALYST-04 weekly — commerce and benchmarks do not move hourly.',
          'FORGE-06 on weekends, when you have the quiet hours to actually build.',
          'AXIS-07 daily. Five minutes of synthesis protects forty hours of work.',
        ],
      },
    ],
  },
];

export const AGENT_MAP: Record<AgentId, Agent> = AGENTS.reduce(
  (acc, a) => ({ ...acc, [a.id]: a }),
  {} as Record<AgentId, Agent>
);

export const HERO_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/6a8bce37b1a9555656dee3ce_1787548459378_b100490d.jpg';

export const GLOBAL_STATS = [
  { label: 'Sources swept daily', value: 48200, suffix: '' },
  { label: 'Opportunities ranked', value: 21, suffix: '/day' },
  { label: 'Platforms connected', value: 52, suffix: '' },
  { label: 'Agents working for you', value: 7, suffix: '' },
];

export const PIPELINE_STEPS = [
  { step: '01', title: 'Ingest', body: 'Every agent runs MCP connectors plus live web search against its own source list. Nothing is cached from yesterday.' },
  { step: '02', title: 'Rank', body: 'Signals are scored on freshness, learnability, margin and saturation. Only the top 3 per agent survive.' },
  { step: '03', title: 'Benchmark', body: 'ANALYST-04 tears down the top 5 of each surviving category and writes an improved system prompt.' },
  { step: '04', title: 'Compound', body: 'FORGE-06 maps the agent platforms and fuses up to seven workflows into one small, executable skill.' },
  { step: '05', title: 'Direct', body: 'AXIS-07 reads every agent and returns one ordered path — with checkpoints, kill-criteria, and a schedule.' },
];

export const ACTIVITY_LOG = [
  { agent: 'SCOUT-01', text: 'Swept 4,180 listings across 9 marketplaces', time: '02m ago', tone: 'text-sky-600' },
  { agent: 'RADAR-03', text: 'New weak signal: AI compliance docs, gap ratio 14:1', time: '09m ago', tone: 'text-amber-600' },
  { agent: 'FORGE-06', text: 'Compounded 7 bookkeeping workflows into 1 skill · −64% steps', time: '12m ago', tone: 'text-teal-600' },
  { agent: 'SCOUT-02', text: '12,600 SKUs evaluated — 3 cleared the 70% margin gate', time: '17m ago', tone: 'text-emerald-600' },
  { agent: 'AXIS-07', text: 'Final report issued · one path, 5 checkpoints, 2 kill-criteria', time: '24m ago', tone: 'text-rose-600' },
  { agent: 'ANALYST-04', text: '25 teardowns complete, prompt v2 emitted for 3 categories', time: '31m ago', tone: 'text-violet-600' },
  { agent: 'GROWTH-05', text: 'Scanned 214 new GitHub releases · 6 added to cheap stack', time: '44m ago', tone: 'text-cyan-600' },
  { agent: 'FORGE-06', text: 'Gated helper spawned, task complete, terminated · 0 standing access', time: '51m ago', tone: 'text-teal-600' },
];

export const PRINCIPLES = [
  { title: 'Report, never act', body: 'Agents surface and rank. They never apply to a gig, place an order, or post on your behalf. You stay the operator.' },
  { title: 'Fresh or discarded', body: 'Anything older than the cycle window is dropped. Yesterday\'s opportunity is somebody else\'s saturated niche.' },
  { title: 'Gated by default', body: 'Any spawned helper starts with zero permissions — no tools, no network, no memory — and terminates when the task ends.' },
  { title: 'Kindness is a requirement', body: 'Respect for people and for the agents that serve you is not decoration here. It is the condition of access.' },
];
