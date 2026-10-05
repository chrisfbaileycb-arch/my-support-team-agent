/**
 * Maximize Your Future · Final Report Controller (report.js)
 * Isolated Page Script for report.html
 */

(function () {
  'use strict';

  function init() {
    const { AGENTS, Storage, toast, apiFetch } = window.MYF;

    // Load active pipeline to feed the synthesis
    const pipeline = Storage.getPipeline();
    const topOpportunity = pipeline[0] || {
      title: 'Restaurant Shift Ops & Margin Optimization',
      payout: '$2,800 fixed',
      source: 'Upwork Enterprise',
    };

    let currentReport = {
      title: `Path to ${topOpportunity.title}`,
      outcome: 'First reliable $2,500/mo income line',
      next24h: `Reach out to 3 target businesses with custom video audits evaluating their shift margins. Deliver without asking for money upfront.`,
      steps: [
        { n: 1, title: 'Extract Target List', action: `Use KAI-01 Freelance Scout to compile 10 verified business prospects matching "${topOpportunity.title}".`, agent: 'KAI-01', time: '90 mins', done: false },
        { n: 2, title: 'Draft Teardown Audit', action: 'Construct a 3-point operational audit addressing labor scheduling overhead.', agent: 'LEO-04', time: '2 hours', done: false },
        { n: 3, title: 'Distribution Outreach', action: 'Send 5 personalized teardowns via AVA-05 Free Growth Engine distribution channels.', agent: 'AVA-05', time: '1 hour', done: false },
        { n: 4, title: 'Closing & Retainer Agreement', action: `Sign contract at ${topOpportunity.payout} with 50% upfront deposit on delivery milestones.`, agent: 'AXIS-07', time: '1 hour', done: false },
      ],
      killCriteria: 'If zero responses after 72 hours and 5 qualified touches, terminate this campaign and shift to candidate #2 in pipeline.',
    };

    // Render Steps
    function renderSteps() {
      const container = document.getElementById('steps-container');
      if (!container) return;

      container.innerHTML = currentReport.steps.map((step) => `
        <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <input 
            type="checkbox" 
            class="step-check" 
            data-index="${step.n}" 
            ${step.done ? 'checked' : ''} 
            style="margin-top: 4px; width: 18px; height: 18px; cursor: pointer;"
          />
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 0.875rem; color: var(--text-primary); ${step.done ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                Step ${step.n}: ${step.title}
              </strong>
              <span class="badge badge-indigo">${step.agent} · ${step.time}</span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.4; ${step.done ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
              ${step.action}
            </p>
          </div>
        </div>
      `).join('');

      // Attach checkbox change listeners
      document.querySelectorAll('.step-check').forEach((chk) => {
        chk.addEventListener('change', () => {
          const idx = parseInt(chk.getAttribute('data-index'), 10);
          const s = currentReport.steps.find((st) => st.n === idx);
          if (s) {
            s.done = chk.checked;
            renderSteps();
            toast(`Step ${idx} marked as ${s.done ? 'completed' : 'pending'}`, 'info');
          }
        });
      });
    }

    // Handle Form Submit: Re-compile
    const form = document.getElementById('report-constraints-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const goal = document.getElementById('report-goal').value.trim();
      const hours = document.getElementById('report-hours').value;
      const budget = document.getElementById('report-budget').value;
      const level = document.getElementById('report-level').value;

      currentReport.outcome = goal;
      currentReport.steps[0].action = `Extract qualified leads for ${goal} matching ${hours} capacity.`;
      currentReport.next24h = `Execute Step 1 within your ${hours} budget. Zero capital required (${budget}).`;

      renderSteps();
      document.getElementById('report-24h').textContent = currentReport.next24h;
      toast('AXIS-07 compiled fresh path with your constraints', 'success');
    });

    // Generate Markdown representation
    function generateMarkdown() {
      const lines = [];
      lines.push(`# ${currentReport.title}`);
      lines.push(`_AXIS-07 Single Ordered Path · Compiled ${new Date().toLocaleDateString()}_`, '');
      lines.push(`**Target Outcome:** ${currentReport.outcome}`, '');
      lines.push(`## The Next 24 Hours`);
      lines.push(currentReport.next24h, '');
      lines.push(`## Action Steps`);
      currentReport.steps.forEach((s) => {
        const mark = s.done ? '[x]' : '[ ]';
        lines.push(`${s.n}. ${mark} **${s.title}** (${s.agent} — ${s.time})`);
        lines.push(`   ${s.action}`);
      });
      lines.push('', `## Kill Criteria`);
      lines.push(currentReport.killCriteria, '');
      lines.push('---', 'All good goes to the one true Source, the Maker of Everything. All harm is cut off.');
      return lines.join('\n');
    }

    // Copy Markdown button
    document.getElementById('copy-markdown-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(generateMarkdown());
      toast('Markdown report copied to clipboard', 'success');
    });

    // Download Markdown button
    document.getElementById('download-markdown-btn')?.addEventListener('click', () => {
      const md = generateMarkdown();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axis-07-path-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Downloaded report file', 'success');
    });

    // Initial render
    renderSteps();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
