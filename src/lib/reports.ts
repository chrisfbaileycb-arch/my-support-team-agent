import { supabase } from '@/lib/supabase';
import { AGENT_MAP } from '@/data/agents';

export interface ReportStep {
  n: number;
  title: string;
  action: string;
  agent?: string;
  time?: string;
  checkpoint?: string;
  killCriteria?: string;
}

export interface FinalReport {
  id: string | null;
  user_id?: string;
  title: string;
  summary: string;
  agent_summaries: { codename: string; line: string }[];
  conflicts: { between: string; decision: string; why: string }[];
  steps: ReportStep[];
  schedule_advice: { codename: string; cadence: string; why: string }[];
  next_24h: string;
  completed_steps: number[];
  created_at: string;
}

export interface ReportInputs {
  goal: string;
  hours: string;
  budget: string;
  level: string;
}

export const generateReport = async (
  userId: string,
  inputs: ReportInputs
): Promise<{ report: FinalReport; usedRuns: number; savedCount: number }> => {
  const { data, error } = await supabase.functions.invoke('axis-report', {
    body: {
      userId,
      ...inputs,
      systemPrompt: AGENT_MAP['chief-of-staff'].systemPrompt,
    },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as { report: FinalReport; usedRuns: number; savedCount: number };
};

export const fetchReports = async (userId: string): Promise<FinalReport[]> => {
  const { data, error } = await supabase
    .from('final_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data || []) as FinalReport[];
};

export const saveCompletedSteps = async (reportId: string, completed: number[]): Promise<void> => {
  const { error } = await supabase
    .from('final_reports')
    .update({ completed_steps: completed, updated_at: new Date().toISOString() })
    .eq('id', reportId);
  if (error) throw new Error(error.message);
};

export const deleteReport = async (reportId: string): Promise<void> => {
  const { error } = await supabase.from('final_reports').delete().eq('id', reportId);
  if (error) throw new Error(error.message);
};

/** Render the report as portable markdown for export, clipboard or email. */
export const reportToMarkdown = (r: FinalReport): string => {
  const lines: string[] = [];
  lines.push(`# ${r.title}`);
  lines.push(`_AXIS-07 final path · ${new Date(r.created_at).toLocaleString()}_`, '');
  if (r.summary) lines.push(r.summary, '');
  if (r.agent_summaries?.length) {
    lines.push('## What each agent found');
    r.agent_summaries.forEach((a) => lines.push(`- **${a.codename}** — ${a.line}`));
    lines.push('');
  }
  if (r.conflicts?.length) {
    lines.push('## Conflicts resolved');
    r.conflicts.forEach((c) => lines.push(`- **${c.between}** → ${c.decision} (${c.why})`));
    lines.push('');
  }
  lines.push('## The path');
  (r.steps || []).forEach((s) => {
    const done = (r.completed_steps || []).includes(s.n) ? 'x' : ' ';
    lines.push(`${s.n}. [${done}] **${s.title}** — ${s.action}`);
    if (s.agent) lines.push(`   - Agent: ${s.agent}`);
    if (s.time) lines.push(`   - Time: ${s.time}`);
    if (s.checkpoint) lines.push(`   - Checkpoint: ${s.checkpoint}`);
    if (s.killCriteria) lines.push(`   - Kill criteria: ${s.killCriteria}`);
  });
  lines.push('');
  if (r.schedule_advice?.length) {
    lines.push('## Recommended cadence');
    r.schedule_advice.forEach((s) => lines.push(`- ${s.codename}: ${s.cadence} — ${s.why}`));
    lines.push('');
  }
  if (r.next_24h) lines.push('## Next 24 hours', r.next_24h, '');
  lines.push('---', 'All good goes to the one true Source, the Maker of Everything. All harm is cut off.');
  return lines.join('\n');
};

export const downloadMarkdown = (r: FinalReport) => {
  const blob = new Blob([reportToMarkdown(r)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `axis-07-final-path-${new Date(r.created_at).toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const mailtoLink = (r: FinalReport, email: string): string => {
  const body = reportToMarkdown(r).slice(0, 1800);
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(r.title)}&body=${encodeURIComponent(body)}`;
};
