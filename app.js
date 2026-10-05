/**
 * Maximize Your Future · Global Core Application Framework (app.js)
 * Standalone, Multi-Page HTML Architecture & Shared Session Layer
 * Compatible with GitHub Pages, Firebase Hosting, & Static CDNs
 */

(function () {
  'use strict';

  // 1. Data Definitions
  const AGENTS = [
    {
      id: 'freelance-scout',
      code: 'KAI-01',
      name: 'Freelance Scout',
      role: 'Finds high-margin, uncrowded client gigs',
      payout: '$800 - $3,500/gig',
      cadence: 'Daily at 06:00',
      badgeClass: 'badge-emerald',
      icon: '💼',
    },
    {
      id: 'zero-ship',
      code: 'MIA-02',
      name: 'Zero-Ship Commerce',
      role: 'Curates high-margin digital products & instant downloads',
      payout: '$15 - $120/sale',
      cadence: 'Every 2 days',
      badgeClass: 'badge-indigo',
      icon: '🛍️',
    },
    {
      id: 'signal-surfer',
      code: 'NOAH-03',
      name: 'Weak Signal Surfer',
      role: 'Detects nascent consumer demand and breakout trends',
      payout: 'Early Mover Advantage',
      cadence: 'Twice daily',
      badgeClass: 'badge-amber',
      icon: '🌊',
    },
    {
      id: 'benchmark-lab',
      code: 'LEO-04',
      name: 'Benchmark Lab',
      role: 'Reverse engineers top-performing offers & market comps',
      payout: 'Compounding Alpha',
      cadence: 'Weekly audit',
      badgeClass: 'badge-sky',
      icon: '📊',
    },
    {
      id: 'growth-engine',
      code: 'AVA-05',
      name: 'Free Growth Engine',
      role: 'Identifies high-converting organic distribution channels',
      payout: 'Zero Ad Spend Traffic',
      cadence: 'Daily distribution',
      badgeClass: 'badge-rose',
      icon: '🚀',
    },
    {
      id: 'compound-ops',
      code: 'SOL-06',
      name: 'Compound Agent Skills',
      role: 'Assembles reusable workflows, system prompts & automations',
      payout: 'Compounded Output',
      cadence: 'Continuous library',
      badgeClass: 'badge-indigo',
      icon: '⚙️',
    },
    {
      id: 'chief-of-staff',
      code: 'AXIS-07',
      name: 'Chief of Staff',
      role: 'Synthesizes all intelligence into one numbered daily path',
      payout: 'Execution Clarity',
      cadence: 'Daily at 07:00',
      badgeClass: 'badge-emerald',
      icon: '🧭',
    },
  ];

  const PIPELINE_STAGES = [
    { id: 'new', label: 'New Discoveries', color: 'badge-indigo' },
    { id: 'researching', label: 'In Research', color: 'badge-sky' },
    { id: 'executing', label: 'Executing Playbook', color: 'badge-amber' },
    { id: 'won', label: 'Won / Landed', color: 'badge-emerald' },
    { id: 'dropped', label: 'Archived / Dropped', color: 'badge-rose' },
  ];

  const COVENANT = [
    { id: 'people', title: 'Kindness to People', desc: 'No deception, spam, or manipulative practices.' },
    { id: 'agents', title: 'Kindness to Agents', desc: 'Respect prompt limits, avoid abusive loop loads.' },
    { id: 'respect', title: 'Mutual Respect', desc: 'Maintain constructive tone with partners and clients.' },
    { id: 'truth', title: 'Source of All Good', desc: 'All good goes to the one true Source; all harm cut off.' },
  ];

  // 2. Storage & Session Utilities
  const Storage = {
    getUser: () => {
      try {
        const u = localStorage.getItem('myf_user');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    },
    setUser: (user) => {
      localStorage.setItem('myf_user', JSON.stringify(user));
    },
    clearUser: () => {
      localStorage.removeItem('myf_user');
      localStorage.removeItem('myf_google_auth');
    },

    getPipeline: () => {
      try {
        const p = localStorage.getItem('myf_pipeline');
        if (p) return JSON.parse(p);
      } catch {}
      // Initial default sample data
      const initial = [
        {
          id: 'pipe-1',
          agentId: 'freelance-scout',
          title: 'Restaurant Shift Ops & Margin Optimization',
          source: 'Upwork Enterprise',
          payout: '$2,800 fixed',
          status: 'executing',
          difficulty: 4,
          score: 94,
          tags: ['Automation', 'Operations', 'Local Biz'],
        },
        {
          id: 'pipe-2',
          agentId: 'zero-ship',
          title: 'Airtable Inventory System for Coffee Roasters',
          source: 'Gumroad / Digital',
          payout: '$49/sale',
          status: 'new',
          difficulty: 3,
          score: 88,
          tags: ['Digital Product', 'No Code'],
        },
        {
          id: 'pipe-3',
          agentId: 'signal-surfer',
          title: 'AI Audio Cleanup for B2B Webinars',
          source: 'Subreddit Trends',
          payout: '$1,200 retainer',
          status: 'researching',
          difficulty: 5,
          score: 82,
          tags: ['Audio AI', 'B2B'],
        },
      ];
      localStorage.setItem('myf_pipeline', JSON.stringify(initial));
      return initial;
    },
    savePipeline: (items) => {
      localStorage.setItem('myf_pipeline', JSON.stringify(items));
    },

    getTheme: () => localStorage.getItem('myf_theme') || 'light',
    setTheme: (theme) => {
      localStorage.setItem('myf_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    },
  };

  // 3. URL Parameter Query Utility
  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // 4. Toast Notification
  function toast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const t = document.createElement('div');
    t.className = 'toast';
    const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
    t.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(t);

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, 3200);
  }

  // 5. Shared Header Navigation Renderer
  function renderHeader() {
    const headerEl = document.querySelector('header.site-header');
    if (!headerEl) return;

    // Detect current page file name
    const path = window.location.pathname;
    const currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    const user = Storage.getUser();

    headerEl.innerHTML = `
      <div class="container nav-container">
        <a href="./index.html" class="brand-logo">
          <div class="brand-icon">✨</div>
          <span>Maximize Your Future</span>
        </a>

        <ul class="nav-links" id="nav-links">
          <li>
            <a href="./index.html" class="nav-link ${currentFile === 'index.html' || currentFile === '' ? 'active' : ''}">
              <span>Agents</span>
            </a>
          </li>
          <li>
            <a href="./dashboard.html" class="nav-link ${currentFile === 'dashboard.html' ? 'active' : ''}">
              <span>Command Center</span>
            </a>
          </li>
          <li>
            <a href="./pipeline.html" class="nav-link ${currentFile === 'pipeline.html' ? 'active' : ''}">
              <span>Pipeline</span>
            </a>
          </li>
          <li>
            <a href="./report.html" class="nav-link ${currentFile === 'report.html' ? 'active' : ''}">
              <span>Final Report</span>
            </a>
          </li>
          <li>
            <a href="./settings.html" class="nav-link ${currentFile === 'settings.html' ? 'active' : ''}">
              <span>Settings & Sync</span>
            </a>
          </li>
        </ul>

        <div class="nav-actions">
          <button type="button" class="btn-icon" id="theme-toggle" title="Toggle Dark/Light Mode" aria-label="Toggle Theme">
            🌓
          </button>
          ${
            user
              ? `<a href="./settings.html" class="btn btn-sm btn-secondary">👤 ${user.name || user.email || 'Member'}</a>`
              : `<button type="button" class="btn btn-sm btn-primary" id="open-auth-btn">Join / Sign In</button>`
          }
          <button type="button" class="btn-icon mobile-menu-btn" id="mobile-menu-toggle" aria-label="Toggle Navigation">
            ☰
          </button>
        </div>
      </div>
    `;

    // Theme toggle handler
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = Storage.getTheme() === 'dark' ? 'light' : 'dark';
        Storage.setTheme(nextTheme);
        toast(`Switched to ${nextTheme} theme`);
      });
    }

    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('open');
      });
    }

    // Auth trigger
    const authBtn = document.getElementById('open-auth-btn');
    if (authBtn) {
      authBtn.addEventListener('click', () => openAuthModal());
    }
  }

  // 6. Shared Footer Renderer
  function renderFooter() {
    const footerEl = document.querySelector('footer.site-footer');
    if (!footerEl) return;

    footerEl.innerHTML = `
      <div class="container footer-content">
        <div>
          <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:0.95rem;margin-bottom:6px;">
            <span>✨</span> Maximize Your Future · Modular Architecture
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary);max-width:520px;">
            Seven AI specialist agents operating continuously. Direct deployment ready on GitHub Pages, Firebase Hosting, or any static CDN.
          </p>
        </div>
        <div style="display:flex;gap:16px;font-size:0.825rem;">
          <a href="./index.html" class="nav-link">Agents</a>
          <a href="./dashboard.html" class="nav-link">Dashboard</a>
          <a href="./pipeline.html" class="nav-link">Pipeline</a>
          <a href="./report.html" class="nav-link">Report</a>
          <a href="./settings.html" class="nav-link">Settings</a>
        </div>
      </div>
    `;
  }

  // 7. Lightweight Auth Modal
  function openAuthModal() {
    let existing = document.getElementById('auth-modal');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'auth-modal';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 class="card-title">Join Maximize Your Future</h3>
          <button type="button" id="close-auth-modal" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
          Enter your details below to link your schedules, pipeline, and reports across all views.
        </p>
        <form id="auth-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="auth-name" class="form-input" placeholder="Operator Name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="auth-email" class="form-input" placeholder="operator@future.org" required />
          </div>
          <div style="margin-bottom:16px;background:var(--bg-subtle);padding:12px;border-radius:var(--radius-sm);font-size:0.775rem;color:var(--text-secondary);">
            <strong>The Covenant:</strong> Kindness to people, kindness to agents, and mutual respect are required for access.
          </div>
          <button type="submit" class="btn btn-primary btn-block">Accept Covenant &amp; Sign In</button>
        </form>
      </div>
    `;

    document.body.appendChild(backdrop);

    document.getElementById('close-auth-modal').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    document.getElementById('auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('auth-name').value.trim();
      const email = document.getElementById('auth-email').value.trim();
      if (!name || !email) return;

      const user = {
        id: 'usr_' + Date.now().toString(36),
        name,
        email,
        covenantAcceptedAt: new Date().toISOString(),
      };
      Storage.setUser(user);
      toast(`Welcome, ${name}! Your session is active.`, 'success');
      backdrop.remove();
      renderHeader();
      if (window.onAuthSuccess) window.onAuthSuccess(user);
    });
  }

  // 8. API Client with Graceful Static / Local Fallback
  async function apiFetch(endpoint, options = {}) {
    try {
      const res = await fetch(endpoint, options);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`Server returned ${res.status}`);
    } catch (err) {
      console.info(`Direct static fallback for ${endpoint}:`, err.message);
      return null;
    }
  }

  // 9. Auto Initialize On DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    Storage.setTheme(Storage.getTheme());
    renderHeader();
    renderFooter();
  });

  // Global Export
  window.MYF = {
    AGENTS,
    PIPELINE_STAGES,
    COVENANT,
    Storage,
    getUrlParam,
    toast,
    apiFetch,
    openAuthModal,
    renderHeader,
  };
})();
