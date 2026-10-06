/**
 * FLOWSHIELD–GREYLOOP | Centralized System State Store
 * Single Source of Truth for SCADA environmental monitoring control room,
 * Live Greywater Treatment Stages, Sensors, Water Quality, and M3 Route Selection.
 */

(function (window) {
  'use strict';

  // 6 Physical Greywater Treatment Stages
  const STAGES = [
    {
      id: 1,
      code: '01',
      key: 'inlet',
      name: 'GREYWATER INLET',
      shortName: 'INLET',
      title: 'STAGE 01 — GREYWATER INLET',
      statusText: 'Collection Active',
      desc: 'Household greywater collection from bathing, washing & kitchen drains into interceptor basin.',
      detail: 'Raw greywater is currently entering the inlet interceptor basin from household drainage lines.',
      input: 'Raw household greywater',
      output: 'Collected coarse greywater'
    },
    {
      id: 2,
      code: '02',
      key: 'prefilter',
      name: 'PREFILTER',
      shortName: 'PREFILTER',
      title: 'STAGE 02 — PREFILTER',
      statusText: 'Pre-Filtration Active',
      desc: 'Primary screening to remove lint, hair, larger suspended debris and separate floating grease.',
      detail: 'Greywater is passing through the dual-mesh lint trap and gravity oil/grease interceptor baffle.',
      input: 'Raw greywater',
      output: 'De-greased effluent'
    },
    {
      id: 3,
      code: '03',
      key: 'settling',
      name: 'SETTLING CHAMBER',
      shortName: 'SETTLING',
      title: 'STAGE 03 — SETTLING CHAMBER',
      statusText: 'Sedimentation Active',
      desc: 'Hydraulic retention and baffle sedimentation chamber settling heavier particulate solids.',
      detail: 'Greywater is undergoing baffle sedimentation where heavier suspended particulate solids settle out.',
      input: 'De-greased effluent',
      output: 'Clarified greywater'
    },
    {
      id: 4,
      code: '04',
      key: 'biofilter',
      name: 'VERTICAL BIOFILTER',
      shortName: 'BIOFILTER',
      title: 'STAGE 04 — VERTICAL BIOFILTER',
      statusText: 'Treatment Active',
      desc: 'Multi-layer vertical filtration using biochar, bagasse, coco coir, sand, gravel and phytoremediation root zone.',
      detail: 'Greywater is currently undergoing biological filtration through the multi-layer vertical biofilter.',
      input: 'Clarified greywater',
      output: 'Bio-filtered treated water'
    },
    {
      id: 5,
      code: '05',
      key: 'storage',
      name: 'TREATED WATER STORAGE',
      shortName: 'STORAGE',
      title: 'STAGE 05 — TREATED WATER STORAGE',
      statusText: 'Buffering & Disinfection',
      desc: 'Treated water holding tank equipped with level monitoring, safety disinfection, and buffer capacity.',
      detail: 'Treated water is accumulating in the clean holding tank, ready for automated or manual dispatch.',
      input: 'Bio-filtered water',
      output: 'Treated reusable water'
    },
    {
      id: 6,
      code: '06',
      key: 'routing',
      name: 'M3 ROUTING',
      shortName: 'M3 ROUTING',
      title: 'STAGE 06 — M3 ROUTING',
      statusText: 'Distribution Active',
      desc: 'M3 Treated Water Routing stage: Operator manually selects between Reuse, Recharge, or FloodShield Bypass.',
      detail: 'Treated water is actively dispatched to the selected pathway: Toilet/Irrigation Reuse, Aquifer Recharge, or Flood Bypass.',
      input: 'Disinfected treated water',
      output: 'Selected distribution pathway'
    }
  ];

  let state = {
    status: 'OPERATIONAL', // 'OPERATIONAL', 'WARNING', 'FLOOD_ACTIVE', 'OFFLINE'
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

    // Active View Filter states
    filters: {
      alertSeverity: 'ALL', // 'ALL', 'CRITICAL', 'WARNING', 'INFO'
      sensorStatus: 'ALL',   // 'ALL', 'ONLINE', 'WARNING', 'CRITICAL'
      historyRoute: 'ALL'    // 'ALL', 'REUSE', 'RECHARGE', 'BYPASS'
    },

    sensors: {
      waterLevel: 64.0,
      flowRate: 4.8,
      inletLevel: 72.0,
      outletLevel: 48.0,
      temperature: 28.5,
      humidity: 68.0,
      soilMoisture: 38.0,
      floodSensor: 'NORMAL',
      rechargeStatus: 'ENABLED',
      rechargeValve: 0,   // % open (0-100)
      bypassValve: 0,     // % open (0-100)
      ph: 7.2,
      turbidity: 3.2,
      tds: 240,
      cod: 32,
      bod: 7.8,
      do: 5.4,
      tss: 12,
      oilGrease: 1.8
    },

    devices: {
      controller: { name: 'ESP32 Dual-Core SCADA MCU', status: 'ONLINE', bus: 'WiFi / MQTT', ip: '192.168.1.104' },
      levelSensor: { name: 'Ultrasonic Tank Level Sensor (HC-SR04/JSN)', status: 'ONLINE', bus: 'GPIO / ADC' },
      flowSensor: { name: 'Hall-Effect Flow Meter (YF-S201)', status: 'ONLINE', bus: 'Pulse Counter' },
      moistureSensor: { name: 'Capacitive Soil Moisture Probe (v1.2)', status: 'ONLINE', bus: 'Analog ADC' },
      floodSensor: { name: 'Ground Surface Saturation Probe', status: 'ONLINE', bus: 'Digital Interrupt' },
      rechargeValve: { name: 'Motorized Ball Valve (Recharge Bed)', status: 'ONLINE', bus: 'Relay Actuator' },
      bypassValve: { name: 'Raised Gravity Diversion Gate', status: 'ONLINE', bus: 'Hydraulic Flap' },
      dataService: { name: 'Supabase PostgreSQL Cloud Data Gateway', status: 'ONLINE', bus: 'REST API' }
    },

    waterQuality: {
      summary: 'Effluent parameters adhere to CPCB / IS 10500 Non-Potable Reuse Norms for flushing and landscape irrigation.',
      stages: [
        { parameter: 'pH', unit: '', pre: '6.4', biofilter: '7.0', effluent: '7.2', benchmark: '6.5 – 8.5', status: 'COMPLIANT' },
        { parameter: 'Turbidity', unit: 'NTU', pre: '95.0', biofilter: '12.0', effluent: '3.2', benchmark: '< 5.0 NTU', status: 'COMPLIANT' },
        { parameter: 'TSS', unit: 'mg/L', pre: '120.0', biofilter: '25.0', effluent: '12.0', benchmark: '< 20.0 mg/L', status: 'COMPLIANT' },
        { parameter: 'COD', unit: 'mg/L', pre: '340.0', biofilter: '75.0', effluent: '32.0', benchmark: '< 50.0 mg/L', status: 'COMPLIANT' },
        { parameter: 'BOD₅', unit: 'mg/L', pre: '180.0', biofilter: '28.0', effluent: '7.8', benchmark: '< 10.0 mg/L', status: 'COMPLIANT' },
        { parameter: 'Dissolved Oxygen (DO)', unit: 'mg/L', pre: '1.1', biofilter: '4.2', effluent: '5.4', benchmark: '> 4.0 mg/L', status: 'COMPLIANT' },
        { parameter: 'TDS', unit: 'mg/L', pre: '380.0', biofilter: '260.0', effluent: '240.0', benchmark: '< 500.0 mg/L', status: 'COMPLIANT' },
        { parameter: 'Oil & Grease', unit: 'mg/L', pre: '28.0', biofilter: '4.5', effluent: '1.8', benchmark: '< 5.0 mg/L', status: 'COMPLIANT' }
      ]
    },

    history: {
      flowRate: Array.from({ length: 20 }, (_, i) => +(4.6 + Math.sin(i * 0.4) * 0.4 + Math.random() * 0.1).toFixed(1)),
      waterLevel: Array.from({ length: 20 }, (_, i) => +(63 + Math.cos(i * 0.3) * 1.5 + Math.random() * 0.2).toFixed(1)),
      soilMoisture: Array.from({ length: 20 }, (_, i) => +(38 + Math.sin(i * 0.2) * 0.8).toFixed(1)),
      timestamps: Array.from({ length: 20 }, (_, i) => {
        const d = new Date(Date.now() - (20 - i) * 3000);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      })
    },

    // Session Historical Event Log Entries
    historyLogs: [
      { id: 101, time: '15:08:12', event: 'M3 ROUTE SELECTION', stage: '06 M3 ROUTING', flow: '4.8 L/m', level: '64%', moisture: '38%', flood: 'NORMAL', recharge: 'ENABLED', health: '98%', route: 'REUSE' },
      { id: 102, time: '15:06:40', event: 'STAGE TRANSITION', stage: '05 TREATED STORAGE', flow: '4.7 L/m', level: '62%', moisture: '38%', flood: 'NORMAL', recharge: 'ENABLED', health: '98%', route: 'REUSE' },
      { id: 103, time: '15:04:15', event: 'STAGE TRANSITION', stage: '04 BIOFILTER', flow: '4.9 L/m', level: '60%', moisture: '37%', flood: 'NORMAL', recharge: 'ENABLED', health: '98%', route: 'REUSE' },
      { id: 104, time: '15:01:50', event: 'STAGE TRANSITION', stage: '03 SETTLING CHAMBER', flow: '4.8 L/m', level: '58%', moisture: '38%', flood: 'NORMAL', recharge: 'ENABLED', health: '98%', route: 'REUSE' },
      { id: 105, time: '14:58:30', event: 'STAGE TRANSITION', stage: '02 PREFILTER', flow: '5.0 L/m', level: '56%', moisture: '38%', flood: 'NORMAL', recharge: 'ENABLED', health: '98%', route: 'REUSE' },
      { id: 106, time: '14:55:00', event: 'SYSTEM STARTUP', stage: '01 GREYWATER INLET', flow: '4.5 L/m', level: '55%', moisture: '38%', flood: 'NORMAL', recharge: 'ENABLED', health: '98%', route: 'REUSE' }
    ]
  };

  const listeners = [];

  function subscribe(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  function notify() {
    listeners.forEach(fn => {
      try {
        fn(state);
      } catch (err) {
        console.error('[STATE] Subscriber execution error:', err);
      }
    });
  }

  window.SystemState = {
    STAGES,
    getState: () => state,
    subscribe,
    notify
  };

})(window);
