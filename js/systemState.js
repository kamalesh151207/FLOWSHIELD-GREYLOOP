/**
 * FLOWSHIELD–GREYLOOP | System State Store
 * Centralized state management for SCADA environmental monitoring control room with M3 Route Selection
 */

(function (window) {
  'use strict';

  const STAGES = [
    { id: 1, code: '01', name: 'COLLECTION', desc: 'Household greywater collection from bathing, washing & kitchen drains into interceptor basin.', input: 'Raw household greywater', output: 'Collected coarse greywater' },
    { id: 2, code: '02', name: 'PREFILTRATION', desc: 'Primary screening to remove lint, hair, larger suspended debris and separate floating grease.', input: 'Raw greywater', output: 'De-greased effluent' },
    { id: 3, code: '03', name: 'SETTLING', desc: 'Hydraulic retention and baffle sedimentation chamber settling heavier particulate solids.', input: 'De-greased effluent', output: 'Clarified greywater' },
    { id: 4, code: '04', name: 'BIOFILTER', desc: 'Multi-layer vertical filtration using biochar, bagasse, sand, gravel and phytoremediation root zone.', input: 'Clarified greywater', output: 'Bio-filtered treated water' },
    { id: 5, code: '05', name: 'STORAGE', desc: 'Treated water holding tank equipped with level monitoring and safety disinfection.', input: 'Bio-filtered water', output: 'Treated reusable water' },
    { id: 6, code: '06', name: 'M3 ROUTING', desc: 'M3 Treated Water Routing stage: Operator manually selects between Reuse, Recharge, or FloodShield Bypass.', input: 'Disinfected treated water', output: 'Selected distribution pathway' },
    { id: 7, code: '07', name: 'FINAL DISCHARGE', desc: 'Execution of the active water destination (Reuse flushing/irrigation, Aquifer recharge, or Flood Bypass).', input: 'Routed treated water', output: 'Target destination fulfilled' }
  ];

  let state = {
    status: 'OPERATIONAL', // OPERATIONAL, WARNING, FLOOD_ACTIVE, OFFLINE
    currentStageIndex: 3, // Default Stage 04 BIOFILTER
    stageProgress: 64,
    stageActiveSeconds: 161,
    systemHealth: 98,
    floodMode: false,
    autoPlay: true,
    isPaused: false,
    
    // M3 Routing State
    selectedRoute: 'reuse', // 'reuse', 'recharge', 'bypass'
    routingMode: 'manual',   // 'manual', 'automatic'
    toastMessage: null,

    sensors: {
      waterLevel: 64,
      flowRate: 4.8,
      inletLevel: 72,
      outletLevel: 48,
      temperature: 29.4,
      humidity: 68,
      soilMoisture: 38,
      floodSensor: 'NORMAL',
      rechargeStatus: 'ENABLED',
      rechargeValve: 100, // % open
      bypassValve: 0      // % open
    },

    devices: {
      controller: { name: 'ESP32 Controller', status: 'ONLINE', ip: '192.168.1.104' },
      levelSensor: { name: 'Water Level Sensor', status: 'ONLINE' },
      flowSensor: { name: 'Flow Rate Sensor', status: 'ONLINE' },
      floodSensor: { name: 'Flood Condition Sensor', status: 'ONLINE' },
      controlValve: { name: 'Automated Control Valve', status: 'ONLINE' },
      dataService: { name: 'Data Service', status: 'ONLINE' }
    },

    waterQuality: {
      pH: { val: 7.1, unit: '', status: 'NORMAL' },
      turbidity: { val: 18.0, unit: 'NTU', status: 'NORMAL' },
      tss: { val: 'Demo', unit: 'mg/L', status: 'DEMO' },
      cod: { val: 'Demo', unit: 'mg/L', status: 'DEMO' },
      bod: { val: 'Demo', unit: 'mg/L', status: 'DEMO' },
      oilGrease: { val: 'Demo', unit: 'mg/L', status: 'DEMO' }
    },

    history: {
      flowRate: Array.from({ length: 20 }, (_, i) => 4.6 + Math.sin(i * 0.4) * 0.4 + Math.random() * 0.1),
      waterLevel: Array.from({ length: 20 }, (_, i) => 63 + Math.cos(i * 0.3) * 1.5 + Math.random() * 0.2),
      timestamps: Array.from({ length: 20 }, (_, i) => {
        const d = new Date(Date.now() - (20 - i) * 3000);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      })
    }
  };

  const listeners = [];

  function subscribe(fn) {
    listeners.push(fn);
  }

  function notify() {
    listeners.forEach(fn => fn(state));
  }

  window.SystemState = {
    STAGES,
    getState: () => state,
    subscribe,
    notify
  };

})(window);
