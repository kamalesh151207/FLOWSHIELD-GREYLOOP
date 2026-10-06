/**
 * FLOWSHIELD–GREYLOOP | Alert & Event Log Service
 * Manages SCADA event alarms, severity categorization, stage/route attribution,
 * and Supabase PostgreSQL persistence.
 */

(function (window) {
  'use strict';

  let alerts = [
    {
      id: 1,
      time: '15:08:12',
      severity: 'info',
      title: 'M3 Route Selection Active',
      msg: 'Treated effluent directed to Non-Potable Direct Household Reuse (toilet flushing & garden).',
      stage: '06 M3 ROUTING',
      route: 'REUSE',
      status: 'ACTIVE'
    },
    {
      id: 2,
      time: '15:06:40',
      severity: 'info',
      title: 'Treated Water Storage Nominal',
      msg: 'Buffer tank level at 64%. Clean water safety buffer nominal for distribution.',
      stage: '05 TREATED STORAGE',
      route: 'REUSE',
      status: 'ACTIVE'
    },
    {
      id: 3,
      time: '15:04:15',
      severity: 'info',
      title: 'Vertical Biofilter Nominal Treatment',
      msg: 'Multi-layer organic media (biochar, bagasse, coco coir, rice husk) processing clarified greywater.',
      stage: '04 VERTICAL BIOFILTER',
      route: 'REUSE',
      status: 'ACTIVE'
    },
    {
      id: 4,
      time: '14:58:30',
      severity: 'info',
      title: 'Ground Condition Suitable',
      msg: 'Capacitive soil moisture nominal (38%). Aquifer recharge path confirmed clear and enabled.',
      stage: '06 M3 ROUTING',
      route: 'RECHARGE',
      status: 'RESOLVED'
    }
  ];

  function addAlert(severity, title, msg, meta = {}, persist = true) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentStage = (window.SystemState && window.SystemState.STAGES && window.SystemState.getState) 
      ? window.SystemState.STAGES[window.SystemState.getState().currentStageIndex]?.name || 'SYSTEM'
      : 'SYSTEM';
    const currentRoute = (window.SystemState && window.SystemState.getState) 
      ? (window.SystemState.getState().selectedRoute || 'REUSE').toUpperCase()
      : 'REUSE';

    const newAlert = {
      id: Date.now(),
      time,
      severity: severity || 'info',
      title,
      msg,
      stage: meta.stage || currentStage,
      route: meta.route || currentRoute,
      status: 'ACTIVE'
    };

    alerts.unshift(newAlert);
    if (alerts.length > 50) alerts.pop();

    // Async persist to Supabase if available
    if (persist && window.ApiService && typeof window.ApiService.createAlert === 'function') {
      window.ApiService.createAlert(severity, title, msg).catch(() => {});
    }

    // Update sidebar badge
    updateSidebarBadge();
  }

  function setAlerts(dbAlerts) {
    if (Array.isArray(dbAlerts) && dbAlerts.length > 0) {
      alerts = dbAlerts.map(a => ({
        id: a.id,
        time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString(),
        severity: a.severity || 'info',
        title: a.title,
        msg: a.message,
        stage: 'SYSTEM',
        route: 'AUTO',
        status: (a.status || 'active').toUpperCase()
      }));
      updateSidebarBadge();
    }
  }

  function getAlerts(filter = 'ALL') {
    if (!filter || filter === 'ALL') return alerts;
    return alerts.filter(a => a.severity.toLowerCase() === filter.toLowerCase());
  }

  function clearAlerts() {
    alerts = [];
    updateSidebarBadge();
  }

  function updateSidebarBadge() {
    const badge = document.getElementById('sidebar-alert-badge');
    if (badge) {
      const activeCount = alerts.filter(a => a.status === 'ACTIVE' && (a.severity === 'critical' || a.severity === 'warning')).length;
      badge.textContent = activeCount > 0 ? activeCount : alerts.length;
      badge.style.display = alerts.length > 0 ? 'inline-block' : 'none';
      if (activeCount > 0) {
        badge.style.background = 'var(--status-red)';
      } else {
        badge.style.background = 'var(--blue-secondary)';
      }
    }
  }

  window.AlertService = {
    addAlert,
    setAlerts,
    getAlerts,
    clearAlerts,
    updateSidebarBadge
  };

})(window);
