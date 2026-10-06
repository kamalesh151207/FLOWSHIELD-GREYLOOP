/**
 * FLOWSHIELD–GREYLOOP | Sensor Telemetry Service
 * Hardware registry provider, dynamic telemetry evaluator, and micro-fluctuation generator.
 */

(function (window) {
  'use strict';

  function getSensorRegistry(state) {
    const isFlood = state.floodMode;
    const isRechargeActive = !isFlood && state.selectedRoute === 'recharge';
    const isBypassActive = isFlood || state.selectedRoute === 'bypass';

    return [
      {
        id: 'sens-01',
        name: 'Water Level Sensor (Ultrasonic)',
        tag: 'US-01',
        location: 'Treated Storage Tank',
        value: typeof state.sensors.waterLevel === 'number' ? state.sensors.waterLevel.toFixed(1) : state.sensors.waterLevel,
        unit: '%',
        status: state.sensors.waterLevel > 90 ? 'WARNING (HIGH)' : 'NORMAL',
        statusType: state.sensors.waterLevel > 90 ? 'warning' : 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'GPIO Pulse (Echo/Trig)',
        accuracy: '± 0.5 cm'
      },
      {
        id: 'sens-02',
        name: 'Flow Rate Sensor (Hall Effect)',
        tag: 'FL-01',
        location: 'Treated Discharge Manifold',
        value: typeof state.sensors.flowRate === 'number' ? state.sensors.flowRate.toFixed(1) : state.sensors.flowRate,
        unit: 'L/min',
        status: 'STABLE',
        statusType: 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'Pulse Counter (Interrupt)',
        accuracy: '± 2.0%'
      },
      {
        id: 'sens-03',
        name: 'Inlet Basin Level Sensor',
        tag: 'LV-IN',
        location: 'Household Collection Sump',
        value: typeof state.sensors.inletLevel === 'number' ? state.sensors.inletLevel.toFixed(1) : state.sensors.inletLevel,
        unit: '%',
        status: 'NORMAL',
        statusType: 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'Analog ADC (0–3.3V)',
        accuracy: '± 1.0%'
      },
      {
        id: 'sens-04',
        name: 'Clarifier Settling Level Sensor',
        tag: 'LV-CL',
        location: 'Baffle Sedimentation Chamber',
        value: typeof state.sensors.outletLevel === 'number' ? state.sensors.outletLevel.toFixed(1) : state.sensors.outletLevel,
        unit: '%',
        status: 'NORMAL',
        statusType: 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'Analog ADC (0–3.3V)',
        accuracy: '± 1.0%'
      },
      {
        id: 'sens-05',
        name: 'Temperature Sensor (Digital 1-Wire)',
        tag: 'TMP-01',
        location: 'Biofilter Media Substrate',
        value: typeof state.sensors.temperature === 'number' ? state.sensors.temperature.toFixed(1) : state.sensors.temperature,
        unit: '°C',
        status: 'NORMAL',
        statusType: 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: '1-Wire Digital (DS18B20)',
        accuracy: '± 0.2 °C'
      },
      {
        id: 'sens-06',
        name: 'Enclosure Humidity Sensor',
        tag: 'HUM-01',
        location: 'SCADA MCU Housing',
        value: typeof state.sensors.humidity === 'number' ? state.sensors.humidity.toFixed(0) : state.sensors.humidity,
        unit: '%',
        status: 'NORMAL',
        statusType: 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'I2C Bus (AHT20/DHT22)',
        accuracy: '± 2.0% RH'
      },
      {
        id: 'sens-07',
        name: 'Capacitive Soil Moisture Probe',
        tag: 'MOIST-01',
        location: 'Aquifer Infiltration Bed',
        value: typeof state.sensors.soilMoisture === 'number' ? state.sensors.soilMoisture.toFixed(1) : state.sensors.soilMoisture,
        unit: '%',
        status: isFlood ? 'CRITICAL (94% SATURATED)' : 'NORMAL (38% MOISTURE)',
        statusType: isFlood ? 'critical' : 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'Analog ADC Capacitive v1.2',
        accuracy: '± 1.5%'
      },
      {
        id: 'sens-08',
        name: 'Optical Turbidity Probe',
        tag: 'TURB-01',
        location: 'Post-Biofilter Polishing Cell',
        value: typeof state.sensors.turbidity === 'number' ? state.sensors.turbidity.toFixed(1) : state.sensors.turbidity,
        unit: 'NTU',
        status: 'NORMAL (< 5 NTU)',
        statusType: 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'Analog Optical Turbidity',
        accuracy: '± 0.5 NTU'
      },
      {
        id: 'sens-09',
        name: 'Motorized Recharge Valve Actuator',
        tag: 'VLV-REC',
        location: 'Aquifer Recharge Infiltration Bed',
        value: isFlood ? '0% (CLOSED)' : (isRechargeActive ? '100% (OPEN)' : '0% (CLOSED)'),
        unit: '',
        status: isFlood ? 'SAFETY BLOCKED' : (isRechargeActive ? 'ACTIVE DISCHARGE' : 'STANDBY'),
        statusType: isFlood ? 'critical' : (isRechargeActive ? 'online' : 'warning'),
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'Relay 24V Actuator',
        accuracy: 'Micro-switch verified'
      },
      {
        id: 'sens-10',
        name: 'Raised FloodShield Bypass Gate',
        tag: 'VLV-BYP',
        location: 'Stormwater Diversion Channel',
        value: isBypassActive ? '100% (OPEN)' : '0% (CLOSED)',
        unit: '',
        status: isBypassActive ? 'ACTIVE DIVERSION' : 'STANDBY',
        statusType: isBypassActive ? 'warning' : 'online',
        update: 'Just now',
        connection: 'ONLINE',
        bus: 'Hydraulic Flap Gate',
        accuracy: 'Float limit switch'
      }
    ];
  }

  function getSensorCardsData(state) {
    const isFlood = state.floodMode;
    const isRechargeActive = !isFlood && state.selectedRoute === 'recharge';
    const isBypassActive = isFlood || state.selectedRoute === 'bypass';

    return [
      {
        name: 'WATER LEVEL',
        val: `${typeof state.sensors.waterLevel === 'number' ? state.sensors.waterLevel.toFixed(1) : state.sensors.waterLevel}`,
        unit: '%',
        status: 'NORMAL',
        cls: ''
      },
      {
        name: 'FLOW RATE',
        val: `${typeof state.sensors.flowRate === 'number' ? state.sensors.flowRate.toFixed(1) : state.sensors.flowRate}`,
        unit: 'L/min',
        status: 'STABLE',
        cls: ''
      },
      {
        name: 'INLET LEVEL',
        val: `${typeof state.sensors.inletLevel === 'number' ? state.sensors.inletLevel.toFixed(1) : state.sensors.inletLevel}`,
        unit: '%',
        status: 'NORMAL',
        cls: ''
      },
      {
        name: 'CLARIFIER LEVEL',
        val: `${typeof state.sensors.outletLevel === 'number' ? state.sensors.outletLevel.toFixed(1) : state.sensors.outletLevel}`,
        unit: '%',
        status: 'NORMAL',
        cls: ''
      },
      {
        name: 'TEMPERATURE',
        val: `${typeof state.sensors.temperature === 'number' ? state.sensors.temperature.toFixed(1) : state.sensors.temperature}`,
        unit: '°C',
        status: 'NORMAL',
        cls: ''
      },
      {
        name: 'HUMIDITY',
        val: `${typeof state.sensors.humidity === 'number' ? state.sensors.humidity.toFixed(0) : state.sensors.humidity}`,
        unit: '%',
        status: 'NORMAL',
        cls: ''
      },
      {
        name: 'SOIL MOISTURE',
        val: `${typeof state.sensors.soilMoisture === 'number' ? state.sensors.soilMoisture.toFixed(1) : state.sensors.soilMoisture}`,
        unit: '%',
        status: isFlood ? 'SATURATED' : 'SUITABLE',
        cls: isFlood ? 'crit' : ''
      },
      {
        name: 'RECHARGE STATUS',
        val: isFlood ? 'BLOCKED' : (isRechargeActive ? 'ACTIVE' : 'ENABLED'),
        unit: '',
        status: isFlood ? 'BLOCKED' : 'ENABLED',
        cls: isFlood ? 'crit' : ''
      }
    ];
  }

  function applyMicroFluctuations(state) {
    // Flow rate fluctuations
    state.sensors.flowRate = Math.max(0.5, +(state.sensors.flowRate + (Math.random() - 0.49) * 0.08).toFixed(1));
    state.sensors.temperature = +(28.3 + Math.sin(Date.now() / 15000) * 0.4).toFixed(1);
    state.sensors.humidity = +(68 + Math.cos(Date.now() / 12000) * 1.2).toFixed(0);

    if (state.floodMode) {
      state.sensors.soilMoisture = Math.min(96, +(state.sensors.soilMoisture + 0.2).toFixed(1));
      state.sensors.waterLevel = Math.min(88, +(state.sensors.waterLevel + 0.08).toFixed(1));
    } else {
      state.sensors.soilMoisture = Math.max(36, +(state.sensors.soilMoisture + (38 - state.sensors.soilMoisture) * 0.04).toFixed(1));
      state.sensors.waterLevel = +(64 + Math.sin(Date.now() / 8000) * 1.2).toFixed(1);
    }
  }

  window.SensorService = {
    getSensorRegistry,
    getSensorCardsData,
    applyMicroFluctuations
  };

})(window);
