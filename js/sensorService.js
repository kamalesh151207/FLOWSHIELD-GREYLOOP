/**
 * FLOWSHIELD–GREYLOOP | Sensor Service
 * Real-time telemetry generator, hardware registry, and sensor status evaluator
 */

(function (window) {
  'use strict';

  function getSensorRegistry(state) {
    const isFlood = state.floodMode;
    return [
      { name: 'Water Level Sensor (Ultrasonic)', location: 'Storage Tank', value: `${state.sensors.waterLevel}`, unit: '%', status: 'NORMAL', update: 'Just now', connection: 'ONLINE' },
      { name: 'Flow Rate Sensor (Hall Effect)', location: 'Discharge Pipe', value: `${state.sensors.flowRate}`, unit: 'L/min', status: 'STABLE', update: 'Just now', connection: 'ONLINE' },
      { name: 'Inlet Level Sensor', location: 'Collection Basin', value: `${state.sensors.inletLevel}`, unit: '%', status: 'NORMAL', update: 'Just now', connection: 'ONLINE' },
      { name: 'Outlet Level Sensor', location: 'Clarified Chamber', value: `${state.sensors.outletLevel}`, unit: '%', status: 'NORMAL', update: 'Just now', connection: 'ONLINE' },
      { name: 'Temperature Sensor (Digital)', location: 'Biofilter Media', value: `${state.sensors.temperature}`, unit: '°C', status: 'NORMAL', update: 'Just now', connection: 'ONLINE' },
      { name: 'Humidity Sensor', location: 'Control Housing', value: `${state.sensors.humidity}`, unit: '%', status: 'NORMAL', update: 'Just now', connection: 'ONLINE' },
      { name: 'Capacitive Soil Moisture Probe', location: 'Recharge Bed', value: `${state.sensors.soilMoisture}`, unit: '%', status: isFlood ? 'CRITICAL (94%)' : 'NORMAL (38%)', update: 'Just now', connection: 'ONLINE' },
      { name: 'Flood Condition Sensor', location: 'Ground Surface', value: isFlood ? 'FLOOD DETECTED' : 'NORMAL', unit: '', status: isFlood ? 'WARNING' : 'NORMAL', update: 'Just now', connection: 'ONLINE' },
      { name: 'Recharge State Valve', location: 'Aquifer Infiltration', value: isFlood ? 'BLOCKED' : 'ENABLED', unit: '', status: isFlood ? 'CRITICAL' : 'NORMAL', update: 'Just now', connection: 'ONLINE' },
      { name: 'Bypass State Valve', location: 'Diversion Channel', value: isFlood ? 'ACTIVE' : 'STANDBY', unit: '', status: isFlood ? 'WARNING' : 'NORMAL', update: 'Just now', connection: 'ONLINE' }
    ];
  }

  function getSensorCardsData(state) {
    const isFlood = state.floodMode;
    return [
      { name: 'WATER LEVEL', val: `${state.sensors.waterLevel}`, unit: '%', status: 'NORMAL', cls: '' },
      { name: 'FLOW RATE', val: `${state.sensors.flowRate}`, unit: 'L/min', status: 'STABLE', cls: '' },
      { name: 'INLET LEVEL', val: `${state.sensors.inletLevel}`, unit: '%', status: 'NORMAL', cls: '' },
      { name: 'OUTLET LEVEL', val: `${state.sensors.outletLevel}`, unit: '%', status: 'NORMAL', cls: '' },
      { name: 'TEMPERATURE', val: `${state.sensors.temperature}`, unit: '°C', status: 'NORMAL', cls: '' },
      { name: 'HUMIDITY', val: `${state.sensors.humidity}`, unit: '%', status: 'NORMAL', cls: '' },
      { name: 'FLOOD CONDITION', val: isFlood ? 'SATURATED' : 'NORMAL', unit: '', status: isFlood ? 'FLOOD' : 'NORMAL', cls: isFlood ? 'crit' : '' },
      { name: 'RECHARGE STATUS', val: isFlood ? 'BLOCKED' : 'ENABLED', unit: '', status: isFlood ? 'BLOCKED' : 'ENABLED', cls: isFlood ? 'crit' : '' }
    ];
  }

  function applyMicroFluctuations(state) {
    state.sensors.flowRate = Math.max(0, +(state.sensors.flowRate + (Math.random() - 0.48) * 0.1).toFixed(1));
    state.sensors.temperature = +(29.2 + Math.sin(Date.now() / 12000) * 0.4).toFixed(1);
    state.sensors.humidity = +(68 + Math.cos(Date.now() / 10000) * 1.5).toFixed(0);

    if (state.floodMode) {
      state.sensors.soilMoisture = Math.min(96, state.sensors.soilMoisture + 0.5);
      state.sensors.waterLevel = Math.min(88, +(state.sensors.waterLevel + 0.1).toFixed(1));
    } else {
      state.sensors.soilMoisture = Math.max(36, +(state.sensors.soilMoisture + (38 - state.sensors.soilMoisture) * 0.05).toFixed(1));
      state.sensors.waterLevel = +(64 + Math.sin(Date.now() / 6000) * 1.5).toFixed(1);
    }
  }

  window.SensorService = {
    getSensorRegistry,
    getSensorCardsData,
    applyMicroFluctuations
  };

})(window);
