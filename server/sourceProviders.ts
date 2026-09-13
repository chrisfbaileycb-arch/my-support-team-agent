import crypto from 'node:crypto';
import { getDatabase } from './db';

export type ProvenanceState =
  | 'LIVE_SOURCE'
  | 'MODEL_INFERENCE'
  | 'USER_SUPPLIED'
  | 'CACHED_SOURCE'
  | 'SIMULATED_DEMO';

export type ExecutionMode =
  | 'LIVE_RETRIEVAL'
  | 'MODEL_ONLY'
  | 'SIMULATED'
  | 'FAILED';

export interface SourceRetrievalResult {
  id: string;
  source_provider: string;
  source_name: string;
  source_url: string;
  evidence_type: 'PUBLIC_SIGNAL_API' | 'WEB_GROUNDING' | 'FEED_RETRIEVAL' | 'VERIFIED_CATALOG';
  response_id: string;
  excerpt: string;
  retrieved_at: string;
  confidence: number;
  title: string;
  summary: string;
  raw_payload?: string;
}

export interface ISourceProvider {
  name: string;
  isConfigured(): boolean;
  retrieveSignals(agentId: string, focus?: string): Promise<SourceRetrievalResult[]>;
}

// 1. Live Public Signal Provider: Pulls live developer, freelance, and trend signals from public endpoints
export class PublicSignalProvider implements ISourceProvider {
  name = 'PublicSignalProvider';

  isConfigured(): boolean {
    return true;
  }

  async retrieveSignals(agentId: string, focus?: string): Promise<SourceRetrievalResult[]> {
    const results: SourceRetrievalResult[] = [];
    const now = new Date().toISOString();
    const db = getDatabase();

    try {
      if (agentId === 'trend-radar' || agentId === 'RADAR-03') {
        // Retrieve live hacker news / developer trends
        const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=5&orderBy="$key"');
        if (res.ok) {
          const ids = (await res.json()) as number[];
          const sampleIds = Array.isArray(ids) ? ids.slice(0, 3) : [];

          for (const id of sampleIds) {
            const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (itemRes.ok) {
              const item = await itemRes.json();
              if (item && item.title) {
                const retId = 'src_' + crypto.randomBytes(8).toString('hex');
                const signal: SourceRetrievalResult = {
                  id: retId,
                  source_provider: 'HackerNews Official API (Firebase)',
                  source_name: 'Hacker News Frontpage Trends',
                  source_url: item.url || `https://news.ycombinator.com/item?id=${id}`,
                  evidence_type: 'PUBLIC_SIGNAL_API',
                  response_id: `hn_${id}`,
                  excerpt: `Score: ${item.score || 0} pts by ${item.by || 'anon'} · ${item.descendants || 0} comments`,
                  retrieved_at: now,
                  confidence: 0.95,
                  title: String(item.title),
                  summary: `Direct live signal on developer traction: ${item.title} (Verified score: ${item.score || 0})`,
                };
                results.push(signal);
              }
            }
          }
        }
      } else if (agentId === 'freelance-scout' || agentId === 'SCOUT-01') {
        // Query live RemoteOK public feed
        const res = await fetch('https://remoteok.com/api?tag=ai');
        if (res.ok) {
          const items = (await res.json()) as Record<string, unknown>[];
          const listings = items.filter((i) => i.position && i.company).slice(0, 3);

          for (const item of listings) {
            const retId = 'src_' + crypto.randomBytes(8).toString('hex');
            const signal: SourceRetrievalResult = {
              id: retId,
              source_provider: 'RemoteOK Verified Job Feed',
              source_name: String(item.company || 'Marketplace Client'),
              source_url: String(item.url || 'https://remoteok.com'),
              evidence_type: 'FEED_RETRIEVAL',
              response_id: `rok_${item.id || item.epoch || 'feed'}`,
              excerpt: `Role: ${item.position} · Location: ${item.location || 'Remote'} · Tags: ${Array.isArray(item.tags) ? item.tags.slice(0, 3).join(', ') : 'AI'}`,
              retrieved_at: now,
              confidence: 0.92,
              title: `${item.position} (${item.company})`,
              summary: `Live marketplace demand: ${item.position} requiring delivery capability. Tags: ${Array.isArray(item.tags) ? item.tags.join(', ') : 'Tech'}.`,
            };
            results.push(signal);
          }
        }
      }
    } catch (err) {
      console.warn(`SourceProvider live retrieval failed for ${agentId}:`, err instanceof Error ? err.message : err);
    }

    // Persist verified retrievals to database audit log
    for (const r of results) {
      try {
        db.prepare(`
          INSERT INTO source_retrievals (
            id, agent_id, provider, query, url, excerpt, evidence_type, response_id, confidence, retrieved_at, raw_payload
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          r.id,
          agentId,
          r.source_provider,
          focus || 'default_sweep',
          r.source_url,
          r.excerpt,
          r.evidence_type,
          r.response_id,
          r.confidence,
          r.retrieved_at,
          JSON.stringify({ title: r.title, summary: r.summary })
        );
      } catch {
        // ignore duplicate
      }
    }

    return results;
  }
}

export const defaultSourceProvider = new PublicSignalProvider();
