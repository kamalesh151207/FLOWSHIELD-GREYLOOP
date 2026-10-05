/**
 * FLOWSHIELD–GREYLOOP | Frontend API Client Service
 * Centralized REST API communication with the Supabase-backed backend
 */

(function (window) {
  'use strict';

  const API_BASE = ''; // Same origin

  async function request(endpoint, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      if (!res.ok) {
        let errData;
        try { errData = await res.json(); } catch (_) {}
        const msg = (errData && errData.error) ? errData.error : `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(msg);
      }

      return await res.json();
    } catch (err) {
      console.warn(`[API] Request error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  const ApiService = {
    // 1. Health & Connection Status
    getDatabaseHealth: () => request('/api/health'),

    // 2. System State
    getSystemState: () => request('/api/system/state'),
    updateSystemState: (payload) => request('/api/system/state', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

    // 3. M3 Water Routing
    getRoutingState: () => request('/api/routing'),
    setRoute: (route, mode = 'manual', reason = null) => request('/api/routing', {
      method: 'POST',
      body: JSON.stringify({ route, mode, reason })
    }),

    // 4. Sensor Telemetry
    getLatestSensors: () => request('/api/sensors/latest'),
    getSensorHistory: (limit = 30) => request(`/api/sensors/history?limit=${limit}`),
    recordSensorReading: (reading) => request('/api/sensors', {
      method: 'POST',
      body: JSON.stringify(reading)
    }),

    // 5. System Alerts
    getAlerts: () => request('/api/alerts'),
    createAlert: (severity, title, message) => request('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ severity, title, message })
    }),
    resolveAlert: (id) => request(`/api/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' })
    }),

    // 6. System History
    getHistory: (limit = 50) => request(`/api/history?limit=${limit}`),
    recordHistory: (entry) => request('/api/history', {
      method: 'POST',
      body: JSON.stringify(entry)
    })
  };

  window.ApiService = ApiService;
})(window);
