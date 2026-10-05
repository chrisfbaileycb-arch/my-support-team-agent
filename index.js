/**
 * Maximize Your Future · Homepage Controller (index.js)
 * Isolated Page Script for index.html
 */

(function () {
  'use strict';

  function init() {
    const { AGENTS, COVENANT, Storage, toast } = window.MYF;

    // Update pipeline count stat
    const pipeline = Storage.getPipeline();
    const countEl = document.getElementById('stat-pipeline-count');
    if (countEl) countEl.textContent = pipeline.length;

    // Separate Chief of Staff and the 6 field agents
    const chiefOfStaff = AGENTS.find((a) => a.id === 'chief-of-staff') || AGENTS[AGENTS.length - 1];
    const fieldAgents = AGENTS.filter((a) => a.id !== 'chief-of-staff');

    // 1. Render Chief of Staff as Top Lead Banner Card
    const leadEl = document.getElementById('chief-of-staff-deck-lead');
    if (leadEl && chiefOfStaff) {
      leadEl.innerHTML = `
        <div class="deck-lead-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="font-size: 2.2rem; background: var(--bg-card); width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
                ${chiefOfStaff.icon}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 0.775rem; font-weight: 800; color: var(--primary); font-family: var(--font-mono); letter-spacing: 0.05em;">${chiefOfStaff.code}</span>
                  <span class="badge ${chiefOfStaff.badgeClass}">Lead Strategic Orchestrator</span>
                </div>
                <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 2px;">
                  ${chiefOfStaff.name}
                </h3>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge badge-emerald" style="font-size: 0.8rem; padding: 4px 10px;">${chiefOfStaff.cadence}</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: center;" class="chief-details-row">
            <div>
              <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                ${chiefOfStaff.role}. Formulates the single actionable sequence, calculates kill criteria, and coordinates the 6 domain agents into one consolidated priority path.
              </p>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--bg-card); padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.825rem; border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted);">Executive Output:</span>
                <strong style="color: var(--accent-emerald);">${chiefOfStaff.payout}</strong>
              </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
              <a href="./report.html" class="btn btn-secondary">
                <span>🧭 Synthesize Daily Path</span>
              </a>
              <a href="./dashboard.html?agent=${chiefOfStaff.id}" class="btn btn-primary">
                <span>Launch AXIS Sweep</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Render the 6 Follow-up Specialist Agents in 3x2 Grid
    const deckEl = document.getElementById('agents-deck');
    if (deckEl) {
      deckEl.innerHTML = fieldAgents.map((agent) => `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="card-header" style="margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">${agent.icon}</span>
                <div>
                  <div style="font-size: 0.725rem; font-weight: 700; color: var(--text-muted);">${agent.code}</div>
                  <h4 style="font-size: 1.05rem; font-weight: 700;">${agent.name}</h4>
                </div>
              </div>
              <span class="badge ${agent.badgeClass}">${agent.cadence}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px; min-height: 42px; line-height: 1.45;">
              ${agent.role}
            </p>
            <div style="background: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.8rem; margin-bottom: 16px;">
              <span style="color: var(--text-muted);">Est. Yield:</span>
              <strong style="color: var(--text-primary); margin-left: 4px;">${agent.payout}</strong>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="./dashboard.html?agent=${agent.id}" class="btn btn-primary btn-sm btn-block">
              Launch Sweep
            </a>
            <a href="./pipeline.html?agent=${agent.id}" class="btn btn-secondary btn-sm" title="Filter Pipeline for ${agent.code}">
              🔍
            </a>
          </div>
        </div>
      `).join('');
    }

    // Render Covenant Grid
    const covEl = document.getElementById('covenant-grid');
    if (covEl) {
      covEl.innerHTML = COVENANT.map((c) => `
        <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 16px; border: 1px solid var(--border-color);">
          <h5 style="font-size: 0.9rem; margin-bottom: 6px; color: var(--text-primary);">✨ ${c.title}</h5>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">${c.desc}</p>
        </div>
      `).join('');
    }

    // Handle Morning Briefing Subscription Form
    const briefingForm = document.getElementById('briefing-form');
    if (briefingForm) {
      briefingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('briefing-email');
        const email = emailInput.value.trim();
        if (!email) return;

        // Try API, then local storage
        window.MYF.apiFetch('/api/briefing/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'multi-page-index' }),
        });

        toast(`Subscribed ${email} to daily 06:00 AM dispatch!`, 'success');
        emailInput.value = '';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
