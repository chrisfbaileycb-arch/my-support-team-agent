import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { getDatabase } from './db';

export interface ReportStep {
  n: number;
  title: string;
  action: string;
  agent?: string;
  time?: string;
  checkpoint?: string;
  killCriteria?: string;
}

export interface FinalReportData {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  agent_summaries: { codename: string; line: string }[];
  conflicts: { between: string; decision: string; why: string }[];
  steps: ReportStep[];
  schedule_advice: { codename: string; cadence: string; why: string }[];
  next_24h: string;
  completed_steps: number[];
  references_used: string[];
  provenance: 'MODEL_SYNTHESIS' | 'SIMULATED';
  created_at: string;
  updated_at: string;
}

export async function generateAxisReport(params: {
  userId: string;
  goal?: string;
  hours?: string;
  budget?: string;
  level?: string;
}): Promise<{ report: FinalReportData; usedRuns: number; savedCount: number }> {
  const db = getDatabase();

  // 1. Fetch real agent runs & findings for this user
  const runs = db.prepare(`
    SELECT * FROM agent_runs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(params.userId) as Record<string, unknown>[];

  const findings = db.prepare(`
    SELECT * FROM run_findings
    WHERE user_id = ?
    ORDER BY score DESC
    LIMIT 20
  `).all(params.userId) as Record<string, unknown>[];

  const pipeline = db.prepare(`
    SELECT * FROM pipeline_items
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(params.userId) as Record<string, unknown>[];

  // Check for insufficient data
  if (runs.length === 0 && findings.length === 0 && pipeline.length === 0) {
    throw new Error(
      'INSUFFICIENT_DATA: AXIS-07 requires prerequisite agent findings or pipeline items to synthesize a grounded 14-day path. Please trigger an agent sweep first (e.g., SCOUT-01 or RADAR-03) or bookmark opportunities to your pipeline.'
    );
  }

  const referencesUsed = [
    ...runs.map((r) => String(r.id)),
    ...findings.map((f) => String(f.id)),
  ].slice(0, 15);

  const goal = params.goal || 'Land first $1,000 via AI-assisted operational deliverable';
  const hours = params.hours || '10-15';
  const budget = params.budget || '$0';
  const level = params.level || 'Beginner';

  const reportId = 'rep_' + crypto.randomBytes(12).toString('hex');
  const apiKey = process.env.GEMINI_API_KEY;

  let reportData: Partial<FinalReportData> | null = null;
  let provenance: 'MODEL_SYNTHESIS' | 'SIMULATED' = 'SIMULATED';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are AXIS-07, Chief of Staff.
User Profile & Constraints:
- Primary Goal: "${goal}"
- Weekly Time Budget: "${hours} hours/week"
- Capital Available: "${budget}"
- Experience Level: "${level}"

Upstream Agent Findings (${findings.length} available):
${findings
  .slice(0, 8)
  .map(
    (f) =>
      `- [${f.agent_id}] ${f.title} (Payout: ${f.payout}, Difficulty: ${f.difficulty}/10, Summary: ${f.summary})`
  )
  .join('\n')}

Pipeline Bookmarks (${pipeline.length} items):
${pipeline
  .slice(0, 5)
  .map((p) => `- ${p.title} (Status: ${p.status}, Source: ${p.source})`)
  .join('\n')}

Instructions:
1. Synthesize these real findings into ONE single linear, non-branching 14-day path.
2. Explicitly resolve at least one operational conflict (e.g., low-ticket volume vs packaged retainer).
3. Sequence 5 actionable steps. Every step must name a responsible specialist agent, time estimate, checkpoint verification, and kill criteria.
4. Give crisp guidance for the next 24 hours.

Return STRICT JSON:
{
  "title": "Clear path title",
  "summary": "Executive synthesis paragraph honoring user constraints",
  "agent_summaries": [
    { "codename": "SCOUT-01", "line": "1 sentence key insight" }
  ],
  "conflicts": [
    { "between": "Option A vs Option B", "decision": "Selected decision", "why": "Justification based on constraints" }
  ],
  "steps": [
    {
      "n": 1,
      "title": "Master the Core Deliverable Template",
      "action": "Actionable task",
      "agent": "SCOUT-01",
      "time": "Days 1–3 · 5 hours total",
      "checkpoint": "Observable artifact ready",
      "killCriteria": "Condition under which to abort"
    }
  ],
  "schedule_advice": [
    { "codename": "SCOUT-01", "cadence": "Every 24h", "why": "Reason" }
  ],
  "next_24h": "Immediate first step for today"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      reportData = JSON.parse(response.text || '{}');
      provenance = 'MODEL_SYNTHESIS';
    } catch (err) {
      console.warn('AXIS Gemini synthesis fallback:', err);
    }
  }

  // If fallback or model error, synthesize deterministically from findings
  if (!reportData || !reportData.steps || reportData.steps.length === 0) {
    provenance = 'SIMULATED';
    const topFinding = findings[0] || { title: 'AI Automation Workflow', payout: '$500' };
    reportData = {
      title: `The 14-Day High-Leverage Income Path: ${goal}`,
      summary: `AXIS-07 has synthesized the available data against your constraints (${hours} hrs/week, ${budget} budget, ${level} level). Rather than spreading effort, this linear path focuses strictly on packaging one validated service asset.`,
      agent_summaries: [
        { codename: 'SCOUT-01', line: `Identified primary opportunity: ${topFinding.title}.` },
        { codename: 'BENCH-04', line: 'Validated delivery model with zero upfront software license cost.' },
        { codename: 'GROWTH-05', line: 'Value-first video audit outreach produces 3x higher response rate.' },
        { codename: 'COMPOUND-06', line: 'Retain reusable project deliverable as a recurring service retainer.' },
      ],
      conflicts: [
        {
          between: 'Broad Multi-Channel Testing vs Single Packaged Sprint',
          decision: 'Focus on Single Packaged Sprint',
          why: `Given your ${hours} hrs/week limit, broad testing dilutes execution and delays first cashflow.`,
        },
      ],
      steps: [
        {
          n: 1,
          title: 'Master Master Prompt SOP & Workflow',
          action: 'Build and verify 1 working delivery workflow for client onboarding.',
          agent: 'SCOUT-01',
          time: 'Days 1–3 · 5 hours',
          checkpoint: 'End-to-end demo completed in under 5 minutes.',
          killCriteria: 'If initial setup exceeds 4 hours without output, simplify flow.',
        },
        {
          n: 2,
          title: 'Record 3-Minute Video Showcase',
          action: 'Record a screen walkthrough solving one specific pain point.',
          agent: 'GROWTH-05',
          time: 'Days 4–5 · 3 hours',
          checkpoint: '1 crisp, shareable video link ready.',
          killCriteria: 'Keep video under 3 minutes; avoid over-editing.',
        },
        {
          n: 3,
          title: 'Targeted Direct Value Outreach',
          action: 'Send 15 gentle, value-first messages offering the video audit for free.',
          agent: 'GROWTH-05',
          time: 'Days 6–9 · 4 hours',
          checkpoint: 'At least 2 discovery conversations booked.',
          killCriteria: 'Zero responses across 15 outreach targets indicates hook revision needed.',
        },
        {
          n: 4,
          title: 'Deliver Paid Pilot Milestone',
          action: 'Execute the templated build on schedule and request client testimonial.',
          agent: 'BENCH-04',
          time: 'Days 10–12 · 6 hours',
          checkpoint: 'Deliverable completed and client payment processed.',
          killCriteria: 'Enforce scope boundaries on revision requests.',
        },
        {
          n: 5,
          title: 'Compound Into Ongoing Retainer SOP',
          action: 'Offer ongoing monthly maintenance and archive reusable assets.',
          agent: 'COMPOUND-06',
          time: 'Days 13–14 · 2 hours',
          checkpoint: 'First monthly maintenance agreement proposal active.',
          killCriteria: 'Archive delivery template for next contract cycle.',
        },
      ],
      schedule_advice: [
        { codename: 'SCOUT-01', cadence: 'Every 24h', why: 'Fresh morning marketplace signals.' },
        { codename: 'GROWTH-05', cadence: 'Weekdays', why: 'Active B2B outreach during business hours.' },
        { codename: 'AXIS-07', cadence: 'Weekly', why: 'Weekly recalibration and sprint lock.' },
      ],
      next_24h: 'Spend the first 90 minutes building Step 1: master your single delivery workflow demo before reaching out to prospective clients.',
    };
  }

  const now = new Date().toISOString();
  const createdReport: FinalReportData = {
    id: reportId,
    user_id: params.userId,
    title: reportData.title || 'AXIS-07 14-Day Path Report',
    summary: reportData.summary || '',
    agent_summaries: reportData.agent_summaries || [],
    conflicts: reportData.conflicts || [],
    steps: reportData.steps || [],
    schedule_advice: reportData.schedule_advice || [],
    next_24h: reportData.next_24h || '',
    completed_steps: [],
    references_used: referencesUsed,
    provenance,
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO final_reports (
      id, user_id, title, summary, agent_summaries, conflicts, steps, schedule_advice,
      next_24h, completed_steps, references_used, provenance, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    createdReport.id,
    createdReport.user_id,
    createdReport.title,
    createdReport.summary,
    JSON.stringify(createdReport.agent_summaries),
    JSON.stringify(createdReport.conflicts),
    JSON.stringify(createdReport.steps),
    JSON.stringify(createdReport.schedule_advice),
    createdReport.next_24h,
    JSON.stringify(createdReport.completed_steps),
    JSON.stringify(createdReport.references_used),
    createdReport.provenance,
    createdReport.created_at,
    createdReport.updated_at
  );

  return {
    report: createdReport,
    usedRuns: runs.length,
    savedCount: pipeline.length,
  };
}
