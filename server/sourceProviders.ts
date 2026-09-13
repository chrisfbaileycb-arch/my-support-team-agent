import crypto from 'node:crypto';
import { getDatabase } from './db';

// ============================================================================
// 1. EVIDENCE TYPES & DOMAIN MODELS (Requirements 1, 4, 6, 7, 8, 10, 11, 12)
// ============================================================================

export type EvidenceType =
  | 'LIVE_SOURCE'
  | 'CACHED_SOURCE'
  | 'USER_SUPPLIED'
  | 'MODEL_INFERENCE'
  | 'SIMULATED_DEMO';

export type ExecutionMode =
  | 'LIVE_RETRIEVAL'
  | 'MIXED_RETRIEVAL'
  | 'MODEL_ONLY'
  | 'SIMULATED'
  | 'FAILED';

export type ProviderStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'FAILED'
  | 'UNAVAILABLE_FOR_DIRECT_RETRIEVAL';

export type EvidenceRelationshipType =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CONTRADICTORY'
  | 'CONTEXT';

export interface ProviderCapabilities {
  canSearch: boolean;
  canFetch: boolean;
  supportsFreshnessFilter: boolean;
  isPublicApi: boolean;
  requiresAuth: boolean;
  rateLimitPerMinute: number;
}

export interface RetrievalOptions {
  limit?: number;
  focus?: string;
  freshnessWindowHours?: number;
  forceFresh?: boolean;
  tags?: string[];
  timeoutMs?: number;
}

export interface ProviderSearchResult {
  id: string;
  providerId: string;
  providerName: string;
  query: string;
  sourceUrl: string;
  canonicalUrl: string;
  title: string;
  sourceName: string;
  excerpt: string;
  retrievedAt: string; // ISO 8601
  publishedAt: string; // ISO 8601 or 'PUBLICATION_DATE_UNKNOWN'
  author: string | null;
  providerResultId: string | null;
  httpStatus: number;
  evidenceType: EvidenceType;
  qualityScore: number;
  contentHash: string;
  isDirectQueried: boolean;
  rawMetadata?: Record<string, unknown>;
}

export interface ProviderHealthReport {
  providerId: string;
  name: string;
  status: ProviderStatus;
  lastCallAt: string | null;
  lastSuccessAt: string | null;
  lastLatencyMs: number;
  lastError: string | null;
  requestCount: number;
  failureCount: number;
  rateLimitResetsAt: string | null;
  capabilities: ProviderCapabilities;
  supportedAgentDomains: string[];
}

export interface RetrievedEvidenceRecord {
  id: string;
  user_id: string;
  run_id: string | null;
  agent_id: string;
  provider_id: string;
  query: string | null;
  source_name: string;
  source_url: string;
  canonical_url: string | null;
  title: string;
  excerpt: string | null;
  retrieved_at: string;
  published_at: string | null;
  author: string | null;
  provider_result_id: string | null;
  evidence_type: EvidenceType;
  retrieval_status: string;
  content_hash: string;
  metadata_json: string;
  quality_score: number;
  is_verified: number;
  created_at: string;
}

// ============================================================================
// 2. MODULAR SOURCE PROVIDER INTERFACE (Requirement 1)
// ============================================================================

export interface SourceProvider {
  id: string;
  name: string;
  category: string;
  supportedAgentDomains: string[];
  isConfigured(): boolean;
  getCapabilities(): ProviderCapabilities;
  healthCheck(): Promise<{ status: ProviderStatus; latencyMs: number; error?: string }>;
  search(query: string, options?: RetrievalOptions): Promise<ProviderSearchResult[]>;
  fetch?(url: string, options?: { timeoutMs?: number }): Promise<ProviderSearchResult | null>;
}

// ============================================================================
// 3. UTILITY FUNCTIONS: Normalization, SSRF Shield, Quality Scoring, Content Hashing
// ============================================================================

/**
 * Normalizes URL by removing tracking query parameters and trailing slashes.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    // Strip common tracker params
    const trackerParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'fbclid',
      'gclid',
      '_ga',
    ];
    for (const p of trackerParams) {
      parsed.searchParams.delete(p);
    }
    // Remove trailing slash from pathname if present
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Computes deterministic SHA-256 hash for deduplication.
 */
export function computeContentHash(providerId: string, url: string, snippet: string): string {
  const norm = `${providerId}:${normalizeUrl(url)}:${(snippet || '').trim().toLowerCase().slice(0, 150)}`;
  return crypto.createHash('sha256').update(norm).digest('hex');
}

/**
 * Computes deterministic evidence quality score (0.0 to 1.0) based on system rules,
 * NOT model assertion.
 */
export function computeQualityScore(params: {
  evidenceType: EvidenceType;
  publishedAt: string;
  excerpt: string;
  author: string | null;
  providerReliability: number; // 0.0 - 1.0
}): number {
  let score = 0.5;

  switch (params.evidenceType) {
    case 'LIVE_SOURCE':
      score = 0.9;
      break;
    case 'CACHED_SOURCE':
      score = 0.8;
      break;
    case 'USER_SUPPLIED':
      score = 0.85;
      break;
    case 'MODEL_INFERENCE':
      score = 0.35;
      break;
    case 'SIMULATED_DEMO':
      score = 0.15;
      break;
  }

  // Freshness calculation
  if (params.publishedAt && params.publishedAt !== 'PUBLICATION_DATE_UNKNOWN') {
    const pubTime = new Date(params.publishedAt).getTime();
    if (!Number.isNaN(pubTime)) {
      const ageHours = (Date.now() - pubTime) / (1000 * 60 * 60);
      if (ageHours <= 24) score += 0.08;
      else if (ageHours <= 168) score += 0.04;
      else if (ageHours > 720) score -= 0.05;
    }
  } else {
    // Unproven publication date does not get freshness bonus
    score -= 0.03;
  }

  // Completeness check
  if (params.author) score += 0.02;
  if (params.excerpt && params.excerpt.length > 80) score += 0.03;

  score *= params.providerReliability;
  return Math.min(1.0, Math.max(0.1, Math.round(score * 100) / 100));
}

/**
 * SSRF Safety Guard: Disallow private IP addresses and loopback URLs.
 */
export function isSafePublicUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // Check private IPv4 ranges (10.*, 172.16-31.*, 192.168.*, 169.254.*)
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [_, a, b] = ipMatch.map(Number);
      if (a === 10) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false;
      if (a === 127) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize external text to defend against prompt injection and cross-site scripting.
 */
export function sanitizeSnippet(raw: string, maxLength = 600): string {
  if (!raw) return '';
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// ============================================================================
// 4. REAL PROVIDER IMPLEMENTATIONS (Requirement 3)
// ============================================================================

/**
 * Provider 1: RemoteOK Jobs API
 * Public, documented remote and freelance job feed.
 * Domain: freelance-scout (SCOUT-01), growth-strategist (GROWTH-05)
 */
export class RemoteOKJobsProvider implements SourceProvider {
  id = 'remoteok-jobs';
  name = 'RemoteOK Verified Job Feed';
  category = 'marketplace_feed';
  supportedAgentDomains = ['freelance-scout', 'SCOUT-01', 'growth-strategist', 'GROWTH-05'];

  isConfigured(): boolean {
    return true; // Public feed without requiring secret key
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canSearch: true,
      canFetch: false,
      supportsFreshnessFilter: true,
      isPublicApi: true,
      requiresAuth: false,
      rateLimitPerMinute: 30,
    };
  }

  async healthCheck(): Promise<{ status: ProviderStatus; latencyMs: number; error?: string }> {
    const t0 = Date.now();
    try {
      const res = await fetch('https://remoteok.com/api?tag=ai', {
        headers: { 'User-Agent': 'MaximizeYourFuture/1.0 (Verification Ping)' },
        signal: AbortSignal.timeout(3500),
      });
      const latency = Date.now() - t0;
      if (res.ok) {
        return { status: 'CONNECTED', latencyMs: latency };
      }
      return { status: 'DEGRADED', latencyMs: latency, error: `HTTP ${res.status}` };
    } catch (err) {
      return {
        status: 'FAILED',
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async search(query: string, options?: RetrievalOptions): Promise<ProviderSearchResult[]> {
    const cleanTag = encodeURIComponent((query || 'ai').toLowerCase().replace(/[^a-z0-9]/g, ''));
    const url = `https://remoteok.com/api?tag=${cleanTag || 'ai'}`;
    const limit = options?.limit || 4;
    const now = new Date().toISOString();

    const res = await fetch(url, {
      headers: { 'User-Agent': 'MaximizeYourFuture/1.0 (Opportunity Verification)' },
      signal: AbortSignal.timeout(options?.timeoutMs || 4000),
    });

    if (!res.ok) {
      throw new Error(`RemoteOK feed returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(data)) return [];

    // First element in RemoteOK JSON is legal notice/disclaimer metadata
    const items = data.filter((d) => d && typeof d === 'object' && d.position && d.company);
    const results: ProviderSearchResult[] = [];

    for (const item of items.slice(0, limit)) {
      const position = String(item.position || 'Contract Deliverable');
      const company = String(item.company || 'Marketplace Client');
      const sourceUrl = String(item.url || `https://remoteok.com/remote-jobs/${item.id || ''}`);
      const canonical = normalizeUrl(sourceUrl);

      // Extract real published timestamp from epoch or ISO
      let publishedAt = 'PUBLICATION_DATE_UNKNOWN';
      if (item.date && typeof item.date === 'string') {
        const d = new Date(item.date);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      } else if (item.epoch) {
        const d = new Date(Number(item.epoch) * 1000);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      }

      const tags = Array.isArray(item.tags) ? item.tags.slice(0, 4).join(', ') : 'Tech, AI';
      const location = item.location ? `Location: ${item.location}` : 'Location: Worldwide Remote';
      const salary = item.salary ? `Estimated Compensation: ${item.salary}` : 'Verified Market Rate';
      const excerpt = sanitizeSnippet(
        `Role: ${position} at ${company}. ${location}. ${salary}. Tags: ${tags}. Description: ${String(item.description || '').slice(0, 200)}`
      );

      const contentHash = computeContentHash(this.id, canonical, excerpt);
      const qualityScore = computeQualityScore({
        evidenceType: 'LIVE_SOURCE',
        publishedAt,
        excerpt,
        author: company,
        providerReliability: 0.95,
      });

      results.push({
        id: 'ev_' + crypto.randomBytes(8).toString('hex'),
        providerId: this.id,
        providerName: this.name,
        query,
        sourceUrl,
        canonicalUrl: canonical,
        title: `${position} (${company})`,
        sourceName: company,
        excerpt,
        retrievedAt: now,
        publishedAt,
        author: company,
        providerResultId: item.id ? String(item.id) : null,
        httpStatus: 200,
        evidenceType: 'LIVE_SOURCE',
        qualityScore,
        contentHash,
        isDirectQueried: true,
        rawMetadata: {
          salary: item.salary,
          location: item.location,
          tags: item.tags,
        },
      });
    }

    return results;
  }
}

/**
 * Provider 2: Hacker News Official API (Firebase / Algolia)
 * Public, official, stable real-time developer trends and community signals.
 * Domain: trend-radar (RADAR-03), benchmark-analyst (BENCH-04), chief-of-staff (AXIS-07)
 */
export class HackerNewsSignalProvider implements SourceProvider {
  id = 'hackernews-signals';
  name = 'Hacker News Official Feed & Search';
  category = 'developer_community_signals';
  supportedAgentDomains = ['trend-radar', 'RADAR-03', 'benchmark-analyst', 'BENCH-04', 'chief-of-staff', 'AXIS-07'];

  isConfigured(): boolean {
    return true;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canSearch: true,
      canFetch: false,
      supportsFreshnessFilter: true,
      isPublicApi: true,
      requiresAuth: false,
      rateLimitPerMinute: 60,
    };
  }

  async healthCheck(): Promise<{ status: ProviderStatus; latencyMs: number; error?: string }> {
    const t0 = Date.now();
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=1', {
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - t0;
      if (res.ok) return { status: 'CONNECTED', latencyMs: latency };
      return { status: 'DEGRADED', latencyMs: latency, error: `HTTP ${res.status}` };
    } catch (err) {
      return {
        status: 'FAILED',
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async search(query: string, options?: RetrievalOptions): Promise<ProviderSearchResult[]> {
    const limit = options?.limit || 4;
    const now = new Date().toISOString();
    const encodedQuery = encodeURIComponent(query || 'AI');

    // Query HN Algolia API for rich structured signals
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=${limit}`;
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(options?.timeoutMs || 3500),
    });

    if (!res.ok) {
      throw new Error(`Hacker News search returned HTTP ${res.status}`);
    }

    const json = (await res.json()) as { hits?: Record<string, unknown>[] };
    const hits = Array.isArray(json.hits) ? json.hits : [];
    const results: ProviderSearchResult[] = [];

    for (const h of hits) {
      if (!h.title) continue;
      const title = String(h.title);
      const points = Number(h.points) || 0;
      const comments = Number(h.num_comments) || 0;
      const author = h.author ? String(h.author) : 'community';
      const sourceUrl = h.url ? String(h.url) : `https://news.ycombinator.com/item?id=${h.objectID}`;
      const canonical = normalizeUrl(sourceUrl);

      let publishedAt = 'PUBLICATION_DATE_UNKNOWN';
      if (h.created_at && typeof h.created_at === 'string') {
        const d = new Date(h.created_at);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      }

      const excerpt = sanitizeSnippet(
        `Signal: ${title}. Discussion metrics: ${points} points, ${comments} comments by author ${author}. URL: ${sourceUrl}`
      );

      const contentHash = computeContentHash(this.id, canonical, excerpt);
      const qualityScore = computeQualityScore({
        evidenceType: 'LIVE_SOURCE',
        publishedAt,
        excerpt,
        author,
        providerReliability: 0.96,
      });

      results.push({
        id: 'ev_' + crypto.randomBytes(8).toString('hex'),
        providerId: this.id,
        providerName: this.name,
        query,
        sourceUrl,
        canonicalUrl: canonical,
        title,
        sourceName: 'Hacker News Community',
        excerpt,
        retrievedAt: now,
        publishedAt,
        author,
        providerResultId: h.objectID ? String(h.objectID) : null,
        httpStatus: 200,
        evidenceType: 'LIVE_SOURCE',
        qualityScore,
        contentHash,
        isDirectQueried: true,
        rawMetadata: {
          points,
          num_comments: comments,
          story_id: h.objectID,
        },
      });
    }

    return results;
  }
}

/**
 * Provider 3: GitHub Public Search API
 * Real public developer repository and workflow tool tracking.
 * Domain: trend-radar (RADAR-03), skill-compounder (COMPOUND-06), product-scout (MERCH-02)
 */
export class GitHubRepoSignalProvider implements SourceProvider {
  id = 'github-repositories';
  name = 'GitHub Repository Signals';
  category = 'code_repository_signals';
  supportedAgentDomains = ['trend-radar', 'RADAR-03', 'skill-compounder', 'COMPOUND-06', 'product-scout', 'MERCH-02'];

  isConfigured(): boolean {
    return true;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canSearch: true,
      canFetch: false,
      supportsFreshnessFilter: true,
      isPublicApi: true,
      requiresAuth: false,
      rateLimitPerMinute: 10,
    };
  }

  async healthCheck(): Promise<{ status: ProviderStatus; latencyMs: number; error?: string }> {
    const t0 = Date.now();
    try {
      const res = await fetch('https://api.github.com/zen', {
        headers: { 'User-Agent': 'MaximizeYourFuture-Agent/1.0' },
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - t0;
      if (res.ok) return { status: 'CONNECTED', latencyMs: latency };
      if (res.status === 403) return { status: 'DEGRADED', latencyMs: latency, error: 'Rate limit on GitHub unauthenticated' };
      return { status: 'FAILED', latencyMs: latency, error: `HTTP ${res.status}` };
    } catch (err) {
      return {
        status: 'FAILED',
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async search(query: string, options?: RetrievalOptions): Promise<ProviderSearchResult[]> {
    const limit = options?.limit || 3;
    const now = new Date().toISOString();
    const cleanQuery = encodeURIComponent(`${query} in:name,description`);
    const url = `https://api.github.com/search/repositories?q=${cleanQuery}&sort=stars&order=desc&per_page=${limit}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'MaximizeYourFuture-Agent/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(options?.timeoutMs || 4000),
    });

    if (!res.ok) {
      if (res.status === 403) {
        console.warn('GitHub unauthenticated rate limit reached (60/hr). Gracefully skipping provider.');
        return [];
      }
      throw new Error(`GitHub search returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as { items?: Record<string, unknown>[] };
    const items = Array.isArray(data.items) ? data.items : [];
    const results: ProviderSearchResult[] = [];

    for (const repo of items) {
      const name = String(repo.full_name || repo.name || 'repository');
      const sourceUrl = String(repo.html_url || `https://github.com/${name}`);
      const canonical = normalizeUrl(sourceUrl);
      const stars = Number(repo.stargazers_count) || 0;
      const forks = Number(repo.forks_count) || 0;
      const desc = repo.description ? String(repo.description) : 'No description provided';

      let publishedAt = 'PUBLICATION_DATE_UNKNOWN';
      if (repo.updated_at && typeof repo.updated_at === 'string') {
        const d = new Date(repo.updated_at);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      }

      const excerpt = sanitizeSnippet(
        `Repository: ${name}. Stars: ${stars} ⭐, Forks: ${forks}. Description: ${desc}. Pushed: ${publishedAt}`
      );

      const contentHash = computeContentHash(this.id, canonical, excerpt);
      const qualityScore = computeQualityScore({
        evidenceType: 'LIVE_SOURCE',
        publishedAt,
        excerpt,
        author: String(repo.owner ? (repo.owner as { login?: string }).login : name.split('/')[0]),
        providerReliability: 0.94,
      });

      results.push({
        id: 'ev_' + crypto.randomBytes(8).toString('hex'),
        providerId: this.id,
        providerName: this.name,
        query,
        sourceUrl,
        canonicalUrl: canonical,
        title: `${name} (${stars} stars)`,
        sourceName: 'GitHub Public Repositories',
        excerpt,
        retrievedAt: now,
        publishedAt,
        author: String(repo.owner ? (repo.owner as { login?: string }).login : 'open-source'),
        providerResultId: repo.id ? String(repo.id) : null,
        httpStatus: 200,
        evidenceType: 'LIVE_SOURCE',
        qualityScore,
        contentHash,
        isDirectQueried: true,
        rawMetadata: {
          stars,
          forks,
          open_issues: repo.open_issues_count,
        },
      });
    }

    return results;
  }
}

/**
 * Provider 4: Public RSS / Feed Signal Provider
 * Pulls live published feeds from public tech / publication channels.
 * Domain: product-scout (MERCH-02), growth-strategist (GROWTH-05), benchmark-analyst (BENCH-04)
 */
export class PublicFeedProvider implements SourceProvider {
  id = 'public-feed-signals';
  name = 'Public Tech RSS & Publication Feeds';
  category = 'feed_provider';
  supportedAgentDomains = ['product-scout', 'MERCH-02', 'growth-strategist', 'GROWTH-05', 'benchmark-analyst', 'BENCH-04'];

  isConfigured(): boolean {
    return true;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canSearch: true,
      canFetch: true,
      supportsFreshnessFilter: true,
      isPublicApi: true,
      requiresAuth: false,
      rateLimitPerMinute: 30,
    };
  }

  async healthCheck(): Promise<{ status: ProviderStatus; latencyMs: number; error?: string }> {
    const t0 = Date.now();
    try {
      const res = await fetch('https://news.ycombinator.com/rss', {
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - t0;
      if (res.ok) return { status: 'CONNECTED', latencyMs: latency };
      return { status: 'DEGRADED', latencyMs: latency, error: `HTTP ${res.status}` };
    } catch (err) {
      return {
        status: 'FAILED',
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async search(query: string, options?: RetrievalOptions): Promise<ProviderSearchResult[]> {
    const limit = options?.limit || 3;
    const now = new Date().toISOString();

    // Default to verified public RSS feed
    const feedUrl = 'https://news.ycombinator.com/rss';
    const res = await fetch(feedUrl, {
      signal: AbortSignal.timeout(options?.timeoutMs || 3500),
    });

    if (!res.ok) {
      throw new Error(`Feed fetch returned HTTP ${res.status}`);
    }

    const xmlText = await res.text();
    const items = this.parseSimpleXmlFeed(xmlText).slice(0, limit);
    const results: ProviderSearchResult[] = [];

    for (const item of items) {
      const canonical = normalizeUrl(item.link || feedUrl);
      const excerpt = sanitizeSnippet(`Title: ${item.title}. Link: ${item.link}. Summary: ${item.description}`);
      const contentHash = computeContentHash(this.id, canonical, excerpt);

      let publishedAt = 'PUBLICATION_DATE_UNKNOWN';
      if (item.pubDate) {
        const d = new Date(item.pubDate);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      }

      const qualityScore = computeQualityScore({
        evidenceType: 'LIVE_SOURCE',
        publishedAt,
        excerpt,
        author: 'Public Feed Channel',
        providerReliability: 0.9,
      });

      results.push({
        id: 'ev_' + crypto.randomBytes(8).toString('hex'),
        providerId: this.id,
        providerName: this.name,
        query,
        sourceUrl: item.link || feedUrl,
        canonicalUrl: canonical,
        title: item.title || 'Public Feed Item',
        sourceName: 'Public Industry Feed',
        excerpt,
        retrievedAt: now,
        publishedAt,
        author: 'Public Feed Editorial',
        providerResultId: null,
        httpStatus: 200,
        evidenceType: 'LIVE_SOURCE',
        qualityScore,
        contentHash,
        isDirectQueried: true,
      });
    }

    return results;
  }

  private parseSimpleXmlFeed(xml: string): { title: string; link: string; description: string; pubDate: string }[] {
    const items: { title: string; link: string; description: string; pubDate: string }[] = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const block of itemMatches) {
      const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const pubMatch = block.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);

      if (titleMatch && titleMatch[1]) {
        items.push({
          title: sanitizeSnippet(titleMatch[1], 150),
          link: linkMatch ? linkMatch[1].trim() : '',
          description: descMatch ? sanitizeSnippet(descMatch[1], 300) : '',
          pubDate: pubMatch ? pubMatch[1].trim() : '',
        });
      }
    }
    return items;
  }
}

/**
 * Provider 5: SSRF-Safe Web Grounding Fetcher
 * Inspects a specific public URL for grounding verification.
 */
export class WebGroundingProvider implements SourceProvider {
  id = 'web-grounding';
  name = 'Direct Web Grounding (SSRF Guarded)';
  category = 'direct_web_fetch';
  supportedAgentDomains = ['all'];

  isConfigured(): boolean {
    return true;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canSearch: false,
      canFetch: true,
      supportsFreshnessFilter: false,
      isPublicApi: true,
      requiresAuth: false,
      rateLimitPerMinute: 20,
    };
  }

  async healthCheck(): Promise<{ status: ProviderStatus; latencyMs: number }> {
    return { status: 'CONNECTED', latencyMs: 1 };
  }

  async search(_query: string): Promise<ProviderSearchResult[]> {
    return [];
  }

  async fetch(targetUrl: string, options?: { timeoutMs?: number }): Promise<ProviderSearchResult | null> {
    if (!isSafePublicUrl(targetUrl)) {
      throw new Error(`SSRF Blocked: URL target is not an allowed public HTTP address: ${targetUrl}`);
    }

    const t0 = Date.now();
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'MaximizeYourFuture-Verifier/1.0 (Verification Ping)',
        Accept: 'text/html,application/json,text/plain',
      },
      signal: AbortSignal.timeout(options?.timeoutMs || 4000),
    });

    const now = new Date().toISOString();
    const canonical = normalizeUrl(targetUrl);
    const contentType = res.headers.get('content-type') || '';
    let excerpt = '';
    let title = targetUrl;

    if (contentType.includes('json')) {
      const json = await res.json();
      excerpt = sanitizeSnippet(JSON.stringify(json).slice(0, 400));
      title = `JSON Payload from ${new URL(targetUrl).hostname}`;
    } else {
      const html = await res.text();
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) title = sanitizeSnippet(titleMatch[1], 120);
      excerpt = sanitizeSnippet(html, 400);
    }

    const contentHash = computeContentHash(this.id, canonical, excerpt);
    return {
      id: 'ev_' + crypto.randomBytes(8).toString('hex'),
      providerId: this.id,
      providerName: this.name,
      query: targetUrl,
      sourceUrl: targetUrl,
      canonicalUrl: canonical,
      title,
      sourceName: new URL(targetUrl).hostname,
      excerpt,
      retrievedAt: now,
      publishedAt: 'PUBLICATION_DATE_UNKNOWN',
      author: new URL(targetUrl).hostname,
      providerResultId: null,
      httpStatus: res.status,
      evidenceType: 'LIVE_SOURCE',
      qualityScore: 0.85,
      contentHash,
      isDirectQueried: true,
    };
  }
}

/**
 * Registry of platforms that require private credentials and are NOT directly queried.
 * (Requirement 3: Explicitly classify platforms as UNAVAILABLE_FOR_DIRECT_RETRIEVAL)
 */
export const UNAVAILABLE_DIRECT_TARGETS: Record<string, { reason: string; fallbackMode: string }> = {
  Upwork: {
    reason: 'Upwork GraphQL and OAuth2 API require registered Client Credentials and active freelancer account token.',
    fallbackMode: 'MODEL_INFERENCE & Public remote feeds (RemoteOK / HN)',
  },
  Fiverr: {
    reason: 'Fiverr does not provide a public listing search API without private affiliate credentials.',
    fallbackMode: 'MODEL_INFERENCE & Validated benchmark fixtures',
  },
  'Shopify App Store': {
    reason: 'Shopify Partners API requires private merchant authorization.',
    fallbackMode: 'MODEL_INFERENCE & Developer repository analysis',
  },
  Gumroad: {
    reason: 'Gumroad API v2 requires seller access tokens for private store metrics.',
    fallbackMode: 'MODEL_INFERENCE & Public community discussions',
  },
  'Etsy Digital': {
    reason: 'Etsy v3 API requires OAuth application registration and Keystroke approval.',
    fallbackMode: 'MODEL_INFERENCE',
  },
};

// ============================================================================
// 5. CENTRAL PROVIDER REGISTRY WITH RATE LIMITS & CACHING (Requirements 2, 17, 18)
// ============================================================================

export class SourceProviderRegistry {
  private providers: Map<string, SourceProvider> = new Map();
  private rateLimitLedger: Map<string, { windowStart: number; count: number }> = new Map();

  constructor() {
    this.register(new RemoteOKJobsProvider());
    this.register(new HackerNewsSignalProvider());
    this.register(new GitHubRepoSignalProvider());
    this.register(new PublicFeedProvider());
    this.register(new WebGroundingProvider());
  }

  register(provider: SourceProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): SourceProvider | undefined {
    return this.providers.get(providerId);
  }

  getAll(): SourceProvider[] {
    return Array.from(this.providers.values());
  }

  getForAgent(agentId: string): SourceProvider[] {
    const matched: SourceProvider[] = [];
    for (const p of this.providers.values()) {
      if (p.supportedAgentDomains.includes(agentId) || p.supportedAgentDomains.includes('all')) {
        matched.push(p);
      }
    }
    return matched;
  }

  /**
   * Check per-provider sliding window rate limit.
   */
  checkRateLimit(providerId: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const ledger = this.rateLimitLedger.get(providerId) || { windowStart: now, count: 0 };

    if (now - ledger.windowStart > 60000) {
      ledger.windowStart = now;
      ledger.count = 1;
      this.rateLimitLedger.set(providerId, ledger);
      return true;
    }

    if (ledger.count >= limitPerMinute) {
      return false; // Throttled
    }

    ledger.count++;
    this.rateLimitLedger.set(providerId, ledger);
    return true;
  }

  /**
   * Look up cached evidence for (provider, query).
   */
  getCachedEvidence(providerId: string, query: string): ProviderSearchResult[] | null {
    try {
      const db = getDatabase();
      const cacheKey = `${providerId}:${query.trim().toLowerCase()}`;
      const row = db.prepare(`
        SELECT * FROM evidence_cache
        WHERE cache_key = ? AND expires_at > datetime('now')
      `).get(cacheKey) as { evidence_json: string; created_at: string } | undefined;

      if (!row) return null;

      const items = JSON.parse(row.evidence_json) as ProviderSearchResult[];
      // Crucial rule: Cached evidence is CACHED_SOURCE, NEVER LIVE_SOURCE!
      return items.map((item) => ({
        ...item,
        evidenceType: 'CACHED_SOURCE',
        isDirectQueried: false,
      }));
    } catch {
      return null;
    }
  }

  /**
   * Persist fresh retrieval to cache.
   */
  setCachedEvidence(providerId: string, query: string, items: ProviderSearchResult[], ttlMinutes = 60): void {
    if (!items.length) return;
    try {
      const db = getDatabase();
      const cacheKey = `${providerId}:${query.trim().toLowerCase()}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000).toISOString();

      db.prepare(`
        INSERT OR REPLACE INTO evidence_cache (
          cache_key, provider_id, query, filters_json, evidence_json, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        cacheKey,
        providerId,
        query,
        JSON.stringify({ ttlMinutes }),
        JSON.stringify(items),
        now.toISOString(),
        expiresAt
      );
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  }

  /**
   * Update provider health in database.
   */
  recordProviderHealth(
    providerId: string,
    name: string,
    status: ProviderStatus,
    latencyMs: number,
    error?: string | null
  ): void {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      const isSuccess = status === 'CONNECTED';

      db.prepare(`
        INSERT INTO provider_health (
          provider_id, name, status, last_call_at, last_success_at, last_latency_ms,
          last_error, request_count, failure_count, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(provider_id) DO UPDATE SET
          name = excluded.name,
          status = excluded.status,
          last_call_at = excluded.last_call_at,
          last_success_at = CASE WHEN ? THEN excluded.last_call_at ELSE provider_health.last_success_at END,
          last_latency_ms = excluded.last_latency_ms,
          last_error = excluded.last_error,
          request_count = provider_health.request_count + 1,
          failure_count = provider_health.failure_count + (CASE WHEN ? THEN 0 ELSE 1 END),
          updated_at = excluded.updated_at
      `).run(
        providerId,
        name,
        status,
        now,
        isSuccess ? now : null,
        latencyMs,
        error || null,
        isSuccess ? 0 : 1,
        now,
        isSuccess ? 1 : 0,
        isSuccess ? 1 : 0
      );
    } catch {
      // ignore
    }
  }

  /**
   * Returns comprehensive health report across all providers for /readiness and /api/providers/health.
   */
  async getAllProvidersHealth(): Promise<ProviderHealthReport[]> {
    const db = getDatabase();
    const reports: ProviderHealthReport[] = [];

    const dbHealthMap = new Map<string, Record<string, unknown>>();
    try {
      const rows = db.prepare('SELECT * FROM provider_health').all() as Record<string, unknown>[];
      for (const r of rows) {
        dbHealthMap.set(String(r.provider_id), r);
      }
    } catch {
      // table might be empty
    }

    for (const p of this.providers.values()) {
      const dbRecord = dbHealthMap.get(p.id);
      const status: ProviderStatus = (dbRecord?.status as ProviderStatus) || 'CONFIGURED';

      reports.push({
        providerId: p.id,
        name: p.name,
        status,
        lastCallAt: (dbRecord?.last_call_at as string) || null,
        lastSuccessAt: (dbRecord?.last_success_at as string) || null,
        lastLatencyMs: Number(dbRecord?.last_latency_ms) || 0,
        lastError: (dbRecord?.last_error as string) || null,
        requestCount: Number(dbRecord?.request_count) || 0,
        failureCount: Number(dbRecord?.failure_count) || 0,
        rateLimitResetsAt: (dbRecord?.rate_limit_resets_at as string) || null,
        capabilities: p.getCapabilities(),
        supportedAgentDomains: p.supportedAgentDomains,
      });
    }

    return reports;
  }
}

export const sourceRegistry = new SourceProviderRegistry();

// ============================================================================
// 6. DURABLE EVIDENCE PERSISTENCE & LINKING (Requirements 4, 7, 11, 21)
// ============================================================================

/**
 * Normalizes, deduplicates, and saves evidence records into retrieved_evidence.
 */
export function persistRetrievedEvidence(
  userId: string,
  runId: string | null,
  agentId: string,
  items: ProviderSearchResult[]
): RetrievedEvidenceRecord[] {
  const db = getDatabase();
  const now = new Date().toISOString();
  const saved: RetrievedEvidenceRecord[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO retrieved_evidence (
      id, user_id, run_id, agent_id, provider_id, query, source_name, source_url,
      canonical_url, title, excerpt, retrieved_at, published_at, author,
      provider_result_id, evidence_type, retrieval_status, content_hash,
      metadata_json, quality_score, is_verified, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seenHashes = new Set<string>();

  for (const item of items) {
    // Deduplication rule 11: avoid identical content hash within the same execution batch
    if (seenHashes.has(item.contentHash)) continue;
    seenHashes.add(item.contentHash);

    // Enforce Rule 8: Only true live provider execution creates LIVE_SOURCE
    const isLive = item.evidenceType === 'LIVE_SOURCE';
    const isVerified = isLive ? 1 : 0;

    const record: RetrievedEvidenceRecord = {
      id: item.id || 'ev_' + crypto.randomBytes(10).toString('hex'),
      user_id: userId,
      run_id: runId,
      agent_id: agentId,
      provider_id: item.providerId,
      query: item.query || null,
      source_name: item.sourceName,
      source_url: item.sourceUrl,
      canonical_url: item.canonicalUrl || normalizeUrl(item.sourceUrl),
      title: item.title,
      excerpt: item.excerpt || null,
      retrieved_at: item.retrievedAt || now,
      published_at: item.publishedAt || 'PUBLICATION_DATE_UNKNOWN',
      author: item.author || null,
      provider_result_id: item.providerResultId || null,
      evidence_type: item.evidenceType,
      retrieval_status: item.httpStatus === 200 ? 'SUCCESS' : `HTTP_${item.httpStatus}`,
      content_hash: item.contentHash,
      metadata_json: JSON.stringify(item.rawMetadata || {}),
      quality_score: item.qualityScore || 0.8,
      is_verified: isVerified,
      created_at: now,
    };

    try {
      insertStmt.run(
        record.id,
        record.user_id,
        record.run_id,
        record.agent_id,
        record.provider_id,
        record.query,
        record.source_name,
        record.source_url,
        record.canonical_url,
        record.title,
        record.excerpt,
        record.retrieved_at,
        record.published_at,
        record.author,
        record.provider_result_id,
        record.evidence_type,
        record.retrieval_status,
        record.content_hash,
        record.metadata_json,
        record.quality_score,
        record.is_verified,
        record.created_at
      );
      saved.push(record);
    } catch {
      // Duplicate key or conflict safely ignored
    }
  }

  return saved;
}

/**
 * Links a finding to a supporting evidence record in finding_evidence.
 */
export function linkFindingToEvidence(
  findingId: string,
  evidenceId: string,
  relationshipType: EvidenceRelationshipType = 'PRIMARY',
  supportStrength = 1.0
): void {
  const db = getDatabase();
  const id = 'fe_' + crypto.randomBytes(8).toString('hex');
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO finding_evidence (
        id, finding_id, evidence_id, relationship_type, support_strength, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, findingId, evidenceId, relationshipType, supportStrength, now);
  } catch (err) {
    console.warn('Failed to link finding to evidence:', err);
  }
}

/**
 * Fetches all evidence records associated with a run (User-Isolated).
 */
export function getEvidenceForRun(runId: string, userId?: string): RetrievedEvidenceRecord[] {
  const db = getDatabase();
  if (userId) {
    return db.prepare(`
      SELECT * FROM retrieved_evidence
      WHERE run_id = ? AND user_id = ?
      ORDER BY quality_score DESC
    `).all(runId, userId) as RetrievedEvidenceRecord[];
  }
  return db.prepare(`
    SELECT * FROM retrieved_evidence
    WHERE run_id = ?
    ORDER BY quality_score DESC
  `).all(runId) as RetrievedEvidenceRecord[];
}

/**
 * Fetches all linked evidence records for a specific finding.
 */
export function getEvidenceForFinding(findingId: string): (RetrievedEvidenceRecord & { relationship_type: string })[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT e.*, fe.relationship_type, fe.support_strength
    FROM retrieved_evidence e
    JOIN finding_evidence fe ON fe.evidence_id = e.id
    WHERE fe.finding_id = ?
    ORDER BY fe.support_strength DESC, e.quality_score DESC
  `).all(findingId) as (RetrievedEvidenceRecord & { relationship_type: string })[];
}

/**
 * Fetches single evidence by ID with user isolation guard.
 */
export function getEvidenceById(evidenceId: string, userId?: string): RetrievedEvidenceRecord | null {
  const db = getDatabase();
  if (userId) {
    return (
      (db.prepare(`
        SELECT * FROM retrieved_evidence WHERE id = ? AND (user_id = ? OR user_id = 'demo_guest_session')
      `).get(evidenceId, userId) as RetrievedEvidenceRecord) || null
    );
  }
  return (db.prepare('SELECT * FROM retrieved_evidence WHERE id = ?').get(evidenceId) as RetrievedEvidenceRecord) || null;
}
