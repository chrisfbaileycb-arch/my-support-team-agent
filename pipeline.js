/**
 * Maximize Your Future · Opportunity Pipeline Controller (pipeline.js)
 * Isolated Page Script for pipeline.html
 */

(function () {
  'use strict';

  function init() {
    const { AGENTS, PIPELINE_STAGES, Storage, getUrlParam, toast } = window.MYF;

    // 1. Populate Filter Dropdown and Modal Agent Dropdown
    const filterSelect = document.getElementById('filter-agent-select');
    const modalAgentSelect = document.getElementById('new-opp-agent');

    if (filterSelect) {
      filterSelect.innerHTML = '<option value="ALL">All 7 Specialist Agents</option>' + 
        AGENTS.map((a) => `<option value="${a.id}">${a.code} — ${a.name}</option>`).join('');

      // State Handoff: Pre-filter by agent from URL
      const agentParam = getUrlParam('agent');
      if (agentParam && AGENTS.some((a) => a.id === agentParam)) {
        filterSelect.value = agentParam;
      }
    }

    if (modalAgentSelect) {
      modalAgentSelect.innerHTML = AGENTS.map((a) => `<option value="${a.id}">${a.code} — ${a.name}</option>`).join('');
    }

    // 2. Render Kanban Columns and Cards
    function renderBoard() {
      const board = document.getElementById('kanban-board');
      if (!board) return;

      const pipeline = Storage.getPipeline();
      const currentFilter = filterSelect ? filterSelect.value : 'ALL';
      const highlightId = getUrlParam('id');

      const filtered = currentFilter === 'ALL' 
        ? pipeline 
        : pipeline.filter((item) => item.agentId === currentFilter);

      board.innerHTML = PIPELINE_STAGES.map((stage) => {
        const stageItems = filtered.filter((item) => item.status === stage.id);

        return `
          <div class="kanban-col" data-stage="${stage.id}">
            <div class="kanban-header">
              <span class="badge ${stage.color}">${stage.label}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${stageItems.length}</span>
            </div>
            <div class="kanban-cards">
              ${
                stageItems.length === 0
                  ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 24px 0; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">No items in ${stage.label}</div>`
                  : stageItems.map((item) => {
                      const agent = AGENTS.find((a) => a.id === item.agentId) || { code: 'AGENT', icon: '✨' };
                      const isHighlighted = item.id === highlightId;
                      return `
                        <div class="kanban-card" id="card-${item.id}" style="${isHighlighted ? 'border: 2px solid var(--primary); box-shadow: 0 0 0 4px rgba(99,102,241,0.2);' : ''}">
                          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary);">
                              ${agent.icon} ${agent.code}
                            </span>
                            <button type="button" class="delete-item-btn" data-id="${item.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.75rem;" title="Remove">✕</button>
                          </div>
                          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 6px; line-height: 1.4;">${item.title}</h4>
                          <div style="font-size: 0.775rem; color: var(--text-secondary); margin-bottom: 10px;">
                            ${item.payout || 'Payout: TBD'} · <span style="color:var(--text-muted);">${item.source}</span>
                          </div>

                          <!-- Stage Mover Controls -->
                          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                            <button type="button" class="btn btn-secondary btn-sm prev-stage-btn" data-id="${item.id}" ${stage.id === 'new' ? 'disabled style="opacity:0.3;"' : ''}>←</button>
                            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Move</span>
                            <button type="button" class="btn btn-secondary btn-sm next-stage-btn" data-id="${item.id}" ${stage.id === 'dropped' ? 'disabled style="opacity:0.3;"' : ''}>→</button>
                          </div>
                        </div>
                      `;
                    }).join('')
              }
            </div>
          </div>
        `;
      }).join('');

      attachCardHandlers();
    }

    // 3. Attach Mover and Delete Handlers
    function attachCardHandlers() {
      const pipeline = Storage.getPipeline();
      const stageIds = PIPELINE_STAGES.map((s) => s.id);

      // Prev stage
      document.querySelectorAll('.prev-stage-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const item = pipeline.find((p) => p.id === id);
          if (!item) return;
          const currentIndex = stageIds.indexOf(item.status);
          if (currentIndex > 0) {
            item.status = stageIds[currentIndex - 1];
            Storage.savePipeline(pipeline);
            renderBoard();
            toast(`Moved to ${stageIds[currentIndex - 1]}`, 'info');
          }
        });
      });

      // Next stage
      document.querySelectorAll('.next-stage-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const item = pipeline.find((p) => p.id === id);
          if (!item) return;
          const currentIndex = stageIds.indexOf(item.status);
          if (currentIndex < stageIds.length - 1) {
            item.status = stageIds[currentIndex + 1];
            Storage.savePipeline(pipeline);
            renderBoard();
            toast(`Advanced to ${stageIds[currentIndex + 1]}`, 'success');
          }
        });
      });

      // Delete item
      document.querySelectorAll('.delete-item-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const next = pipeline.filter((p) => p.id !== id);
          Storage.savePipeline(next);
          renderBoard();
          toast('Opportunity removed from pipeline', 'info');
        });
      });
    }

    // Filter change handler
    filterSelect?.addEventListener('change', renderBoard);

    // 4. Modal Open / Close / Submit
    const modal = document.getElementById('add-opp-modal');
    const openBtn = document.getElementById('open-add-opp-btn');
    const closeBtn = document.getElementById('close-opp-modal');
    const addForm = document.getElementById('add-opp-form');

    openBtn?.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    addForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('new-opp-title').value.trim();
      const agentId = modalAgentSelect.value;
      const payout = document.getElementById('new-opp-payout').value.trim();
      const source = document.getElementById('new-opp-source').value.trim();

      const newItem = {
        id: 'opp_' + Date.now().toString(36),
        agentId,
        title,
        payout,
        source,
        status: 'new',
        difficulty: 4,
        score: 85,
        tags: ['Manual Input'],
      };

      const pipeline = Storage.getPipeline();
      pipeline.unshift(newItem);
      Storage.savePipeline(pipeline);

      modal.style.display = 'none';
      addForm.reset();
      renderBoard();
      toast(`Added "${title}" to Discoveries!`, 'success');
    });

    // Initial render
    renderBoard();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
