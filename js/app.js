/**
 * FLOWSHIELD–GREYLOOP | SCADA Application Controller & Orchestrator
 * Comprehensive event delegation, modal listeners, keyboard shortcuts, and state synchronization
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
     NAVIGATION & VIEW SWITCHING & MOBILE DRAWER
     ══════════════════════════════════════════════════════════════════════════ */
  function initNavigation() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const btnSidebarClose = document.getElementById('btn-sidebar-close');

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

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.dataset.view;
        if (!targetView) return;

        navItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        if (window.Dashboard && typeof window.Dashboard.setActiveView === 'function') {
          window.Dashboard.setActiveView(targetView);
        }

        // Auto close drawer on mobile after selection
        closeSidebar();
      });
    });

    // Window resize & orientation observer to re-render charts & schematics cleanly
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.SystemState) {
          const state = window.SystemState.getState();
          if (window.ChartManager) {
            window.ChartManager.drawFlowChart('chart-flow-canvas', state.history);
            window.ChartManager.drawLevelChart('chart-level-canvas', state.history);
          }
          if (window.SchematicRenderer && window.Dashboard) {
            const activeView = window.Dashboard.getActiveView ? window.Dashboard.getActiveView() : 'overview';
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
    
    // Clear alerts button
    document.getElementById('btn-clear-alerts')?.addEventListener('click', () => {
      if (window.AlertService && typeof window.AlertService.clearAlerts === 'function') {
        window.AlertService.clearAlerts();
      }
      if (window.Dashboard && typeof window.Dashboard.render === 'function' && window.SystemState) {
        window.Dashboard.render(window.SystemState.getState());
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
          SimulationService.setStageIndex(idx);
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
    const demoBadge = document.getElementById('demo-badge');
    const modal = document.getElementById('demo-modal');
    const btnClose = document.getElementById('btn-close-modal');

    if (demoBadge && modal) {
      demoBadge.addEventListener('click', () => modal.classList.add('active'));
    }
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
