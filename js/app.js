/**
 * FLOWSHIELD–GREYLOOP | SCADA Application Controller & Orchestrator
 * Comprehensive event delegation, URL Hash Navigation, modal listeners,
 * keyboard shortcuts, and reactive state synchronization.
 */

(function (window, document) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initControls();
    initTimelineEvents();
    initModal();
    initKeyboardShortcuts();

    // Subscribe dashboard renderer to state changes
    if (window.SystemState && typeof window.SystemState.subscribe === 'function') {
      window.SystemState.subscribe((state) => {
        if (window.Dashboard && typeof window.Dashboard.render === 'function') {
          window.Dashboard.render(state);
        }
      });
    }

    // Handle initial hash navigation if present
    handleHashNavigation();

    // Initial render
    if (window.Dashboard && typeof window.Dashboard.render === 'function' && window.SystemState) {
      window.Dashboard.render(window.SystemState.getState());
    }

    // Start simulation ticker
    if (window.SimulationService && typeof window.SimulationService.initSimulation === 'function') {
      window.SimulationService.initSimulation();
    }

    // Clock update ticker
    setInterval(updateHeaderClock, 1000);
    updateHeaderClock();
  });

  /* ══════════════════════════════════════════════════════════════════════════
     NAVIGATION & VIEW SWITCHING & URL HASH SUPPORT & MOBILE DRAWER
     ══════════════════════════════════════════════════════════════════════════ */
  function initNavigation() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const btnSidebarClose = document.getElementById('btn-sidebar-close');
    const btnHeaderNotif = document.getElementById('btn-header-notif');
    const dbStatusBadge = document.getElementById('db-status-badge');

    function openSidebar() {
      if (sidebar) sidebar.classList.add('mobile-open');
      if (backdrop) backdrop.classList.add('active');
      document.body.classList.add('sidebar-active');
    }

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('sidebar-active');
    }

    if (btnMobileMenu) {
      btnMobileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidebar();
      });
    }

    if (btnSidebarClose) {
      btnSidebarClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSidebar();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        closeSidebar();
      });
    }

    if (btnHeaderNotif) {
      btnHeaderNotif.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToView('alerts');
      });
    }

    if (dbStatusBadge) {
      dbStatusBadge.addEventListener('click', () => {
        const modal = document.getElementById('demo-modal');
        if (modal) modal.classList.add('active');
      });
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.dataset.view;
        if (!targetView) return;

        navigateToView(targetView);
        closeSidebar();
      });
    });

    // Hash change listener
    window.addEventListener('hashchange', () => {
      handleHashNavigation();
    });

    // Window resize & orientation observer to re-render charts & schematics cleanly
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.SystemState) {
          const state = window.SystemState.getState();
          const activeView = window.Dashboard && window.Dashboard.getActiveView ? window.Dashboard.getActiveView() : 'overview';
          
          if (window.ChartManager) {
            if (activeView === 'overview') {
              window.ChartManager.drawFlowChart('chart-flow-canvas', state.history);
              window.ChartManager.drawLevelChart('chart-level-canvas', state.history);
            } else if (activeView === 'live-monitor') {
              window.ChartManager.drawFlowChart('chart-monitor-flow-canvas', state.history);
              window.ChartManager.drawMoistureChart('chart-monitor-level-canvas', state.history);
            }
          }

          if (window.SchematicRenderer) {
            if (activeView === 'overview') {
              window.SchematicRenderer.renderSchematic('svg-schematic-container', state);
            } else if (activeView === 'system-flow') {
              window.SchematicRenderer.renderSchematic('svg-flow-expanded-container', state);
            }
          }
        }
      }, 120);
    });
  }

  function navigateToView(viewName) {
    if (!viewName) return;
    window.location.hash = `#${viewName}`;
    if (window.Dashboard && typeof window.Dashboard.setActiveView === 'function') {
      window.Dashboard.setActiveView(viewName);
    }
  }

  function handleHashNavigation() {
    const hash = window.location.hash.replace(/^#/, '');
    const validViews = ['overview', 'live-monitor', 'system-flow', 'sensors', 'water-quality', 'floodshield', 'alerts', 'history', 'system-info'];
    if (hash && validViews.includes(hash)) {
      if (window.Dashboard && typeof window.Dashboard.setActiveView === 'function') {
        window.Dashboard.setActiveView(hash);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     STAGE & SIMULATION CONTROLS
     ══════════════════════════════════════════════════════════════════════════ */
  function initControls() {
    // Condition toggle buttons
    const btnNormal = document.getElementById('btn-cond-normal');
    const btnFlood = document.getElementById('btn-cond-flood');

    if (btnNormal) {
      btnNormal.addEventListener('click', () => window.SimulationService && window.SimulationService.setFloodCondition(false));
    }
    if (btnFlood) {
      btnFlood.addEventListener('click', () => window.SimulationService && window.SimulationService.setFloodCondition(true));
    }

    // Stage Stepper controls
    document.getElementById('btn-prev-stage')?.addEventListener('click', () => window.SimulationService && window.SimulationService.prevStage());
    document.getElementById('btn-next-stage')?.addEventListener('click', () => window.SimulationService && window.SimulationService.nextStage());
    document.getElementById('btn-autoplay')?.addEventListener('click', () => window.SimulationService && window.SimulationService.toggleAutoPlay());
    document.getElementById('btn-pause-sim')?.addEventListener('click', () => window.SimulationService && window.SimulationService.togglePauseSimulation());
    document.getElementById('btn-reset-demo')?.addEventListener('click', () => window.SimulationService && window.SimulationService.resetSystemDemo());
    
    // Clear alerts button in Overview
    document.getElementById('btn-clear-alerts')?.addEventListener('click', () => {
      if (window.Dashboard && typeof window.Dashboard.clearAllAlerts === 'function') {
        window.Dashboard.clearAllAlerts();
      }
    });
  }

  function initTimelineEvents() {
    const timelineBar = document.getElementById('timeline-bar');
    if (timelineBar) {
      timelineBar.addEventListener('click', (e) => {
        const step = e.target.closest('.timeline-step');
        if (step && step.dataset.stageIdx !== undefined) {
          const idx = parseInt(step.dataset.stageIdx, 10);
          if (window.SimulationService && typeof window.SimulationService.setStageIndex === 'function') {
            window.SimulationService.setStageIndex(idx);
          }
        }
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HEADER CLOCK & DEMO INFO MODAL
     ══════════════════════════════════════════════════════════════════════════ */
  function updateHeaderClock() {
    const clockEl = document.getElementById('header-clock');
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  function initModal() {
    const modal = document.getElementById('demo-modal');
    const btnClose = document.getElementById('btn-close-modal');

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.remove('active'));
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('demo-modal')?.classList.remove('active');
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebar-backdrop')?.classList.remove('active');
        document.body.classList.remove('sidebar-active');
      }
    });
  }

})(window, document);
