/**
 * FLOWSHIELD–GREYLOOP | Alert & Event Log Service
 * Manages SCADA event alarms, severity categorization, and Supabase database persistence
 */

(function (window) {
  'use strict';

  let alerts = [
    { id: 1, time: '21:42:18', severity: 'info', title: 'System Normal', msg: 'Greywater treatment and controlled reuse system operating normally.' },
    { id: 2, time: '21:40:33', severity: 'info', title: 'Biofilter Treatment Active', msg: 'Organic media and plant-based filtration are currently treating greywater.' },
    { id: 3, time: '21:39:10', severity: 'info', title: 'Ground Condition Suitable', msg: 'Soil moisture nominal (38%). Aquifer recharge path enabled.' }
  ];

  function addAlert(severity, title, msg, persist = true) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    alerts.unshift({ id: Date.now(), time, severity, title, msg });
    if (alerts.length > 50) alerts.pop();

    // Async persist to Supabase if available
    if (persist && window.ApiService && typeof window.ApiService.createAlert === 'function') {
      window.ApiService.createAlert(severity, title, msg).catch(() => {});
    }
  }

  function setAlerts(dbAlerts) {
    if (Array.isArray(dbAlerts) && dbAlerts.length > 0) {
      alerts = dbAlerts.map(a => ({
        id: a.id,
        time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString(),
        severity: a.severity || 'info',
        title: a.title,
        msg: a.message
      }));
    }
  }

  function getAlerts() {
    return alerts;
  }

  function clearAlerts() {
    alerts = [];
  }

  window.AlertService = {
    addAlert,
    setAlerts,
    getAlerts,
    clearAlerts
  };

})(window);
