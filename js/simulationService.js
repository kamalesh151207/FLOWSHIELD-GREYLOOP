/**
 * FLOWSHIELD–GREYLOOP | Simulation & Supabase Database Synchronization Engine
 * Manages simulation loop, stage bounds, M3 manual route selection, safety priority logic, and PostgreSQL persistence
 */

(function (window) {
  'use strict';

  const { SystemState, SensorService, AlertService, ApiService } = window;

  let simulationIntervalId = null;
  let telemetrySyncCounter = 0;

  function simulationTick() {
    const state = SystemState.getState();
    if (state.isPaused) return;

    // Apply sensor micro-fluctuations
    SensorService.applyMicroFluctuations(state);

    // Stage timer & auto-advance
    state.stageActiveSeconds++;
    if (state.autoPlay) {
      state.stageProgress += 2;
      if (state.stageProgress >= 100) {
        state.stageProgress = 0;
        state.stageActiveSeconds = 0;
        state.currentStageIndex = (state.currentStageIndex + 1) % SystemState.STAGES.length;
        const currentStage = SystemState.STAGES[state.currentStageIndex];
        AlertService.addAlert('info', 'Stage Auto-Advanced', `Transitioned to stage ${currentStage.code} ${currentStage.name}`);

        // Persist stage change to DB
        if (ApiService && typeof ApiService.updateSystemState === 'function') {
          ApiService.updateSystemState({ currentStage: currentStage.name.toLowerCase() }).catch(() => {});
        }
      }
    }

    // Append to rolling history
    state.history.flowRate.shift();
    state.history.flowRate.push(state.sensors.flowRate);
    
    state.history.waterLevel.shift();
    state.history.waterLevel.push(state.sensors.waterLevel);
    
    state.history.timestamps.shift();
    state.history.timestamps.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // Periodic Database Telemetry Persistence (Every ~12 seconds / 8 ticks)
    telemetrySyncCounter++;
    if (telemetrySyncCounter >= 8) {
      telemetrySyncCounter = 0;
      persistTelemetryToDb(state);
    }

    SystemState.notify();
  }

  async function persistTelemetryToDb(state) {
    if (!ApiService) return;
    try {
      const currentStage = SystemState.STAGES[state.currentStageIndex];
      // 1. Record sensor reading
      await ApiService.recordSensorReading({
        waterLevel: parseFloat(state.sensors.waterLevel.toFixed(1)),
        flowRate: parseFloat(state.sensors.flowRate.toFixed(1)),
        inletLevel: state.sensors.inletLevel,
        outletLevel: state.sensors.outletLevel,
        temperature: state.sensors.temperature,
        humidity: state.sensors.humidity,
        soilMoisture: state.sensors.soilMoisture,
        storageLevel: state.sensors.waterLevel,
        floodCondition: state.floodMode ? 'FLOOD DETECTED' : 'NORMAL',
        rechargeStatus: state.sensors.rechargeStatus,
        bypassStatus: state.sensors.bypassValve > 0 ? 'ACTIVE' : 'STANDBY',
        isDemo: true
      });

      // 2. Record system history snapshot
      await ApiService.recordHistory({
        systemStage: `${currentStage.code} ${currentStage.name}`,
        selectedRoute: state.selectedRoute,
        waterLevel: parseFloat(state.sensors.waterLevel.toFixed(1)),
        flowRate: parseFloat(state.sensors.flowRate.toFixed(1)),
        floodCondition: state.floodMode ? 'flood' : 'normal',
        rechargeEnabled: state.sensors.rechargeValve > 0,
        floodshieldActive: state.floodMode || state.selectedRoute === 'bypass',
        systemHealth: state.systemHealth
      });
    } catch (_) {
      // Handled gracefully in background
    }
  }

  async function setManualRoute(routeKey) {
    const state = SystemState.getState();
    const oldRoute = state.selectedRoute;

    // Safety priority check: Cannot select recharge during flood condition
    if (state.floodMode && routeKey === 'recharge') {
      showToast('RECHARGE BLOCKED: Ground is saturated. Recharge prohibited during flood condition.', 'crit');
      AlertService.addAlert('critical', 'Manual Override Rejected', 'Attempt to select groundwater recharge during active flood was rejected by safety logic.');
      SystemState.notify();
      return;
    }

    // Try backend persistence
    let backendSuccess = true;
    if (ApiService && typeof ApiService.setRoute === 'function') {
      try {
        const res = await ApiService.setRoute(routeKey, state.routingMode, 'Operator manual route selection');
        if (res && res.success === false) {
          showToast(`REJECTED: ${res.error}`, 'crit');
          return;
        }
      } catch (err) {
        console.warn('[ROUTING] Backend routing update failed, applying local fallback:', err.message);
        backendSuccess = false;
      }
    }

    state.selectedRoute = routeKey;

    // Update valve states and route statuses
    if (routeKey === 'reuse') {
      state.sensors.rechargeValve = 0;
      state.sensors.bypassValve = 0;
      state.sensors.rechargeStatus = state.floodMode ? 'BLOCKED' : 'STANDBY';
      showToast('ROUTE SELECTED: REUSE — Direct non-potable distribution active.', 'ok');
      AlertService.addAlert('info', 'M3 Route Selection', `Route changed from ${oldRoute.toUpperCase()} to REUSE. Direct treated-water reuse active.`);
    } else if (routeKey === 'recharge') {
      state.sensors.rechargeValve = 100;
      state.sensors.bypassValve = 0;
      state.sensors.rechargeStatus = 'ENABLED';
      showToast('ROUTE SELECTED: GROUNDWATER RECHARGE — Aquifer infiltration active.', 'ok');
      AlertService.addAlert('info', 'M3 Route Selection', `Route changed from ${oldRoute.toUpperCase()} to GROUNDWATER RECHARGE. Infiltration path active.`);
    } else if (routeKey === 'bypass') {
      state.sensors.rechargeValve = 0;
      state.sensors.bypassValve = 100;
      state.sensors.rechargeStatus = 'BLOCKED';
      showToast('ROUTE SELECTED: FLOODSHIELD BYPASS — Stormwater diversion active.', 'warn');
      AlertService.addAlert('warning', 'M3 Route Selection', `Route changed from ${oldRoute.toUpperCase()} to FLOODSHIELD BYPASS. Controlled bypass channel active.`);
    }

    SystemState.notify();
  }

  async function setRoutingMode(mode) {
    const state = SystemState.getState();
    state.routingMode = mode;

    if (ApiService && typeof ApiService.updateSystemState === 'function') {
      ApiService.updateSystemState({ routingMode: mode }).catch(() => {});
    }

    if (mode === 'automatic') {
      showToast('ROUTING MODE: AUTOMATIC — Dynamic sensor-driven routing logic active.', 'ok');
      if (state.floodMode) {
        setManualRoute('bypass');
      } else {
        setManualRoute('recharge');
      }
    } else {
      showToast('ROUTING MODE: MANUAL — Operator control active.', 'ok');
    }

    SystemState.notify();
  }

  async function setFloodCondition(isFlood) {
    const state = SystemState.getState();
    state.floodMode = isFlood;

    if (isFlood) {
      state.status = 'FLOOD_ACTIVE';
      state.sensors.soilMoisture = 94;
      state.sensors.floodSensor = 'FLOOD DETECTED';
      state.sensors.rechargeStatus = 'BLOCKED';
      state.sensors.rechargeValve = 0;   // CLOSED
      state.sensors.bypassValve = 100;   // OPEN TO BYPASS
      state.systemHealth = 92;

      // Safety priority: If route was recharge, automatically redirect to bypass
      if (state.selectedRoute === 'recharge') {
        state.selectedRoute = 'bypass';
      }

      showToast('⚠ FLOOD SIMULATION ACTIVE — Recharge blocked. Routing diverted to FloodShield bypass.', 'crit');
      AlertService.addAlert('critical', 'Recharge Blocked', 'Recharge automatically blocked due to flood/saturated condition.');
      AlertService.addAlert('info', 'FloodShield Bypass Activated', 'Excess treated water safely redirected to controlled stormwater bypass.');
    } else {
      state.status = 'OPERATIONAL';
      state.sensors.soilMoisture = 38;
      state.sensors.floodSensor = 'NORMAL';
      state.sensors.rechargeStatus = 'ENABLED';
      state.sensors.rechargeValve = state.selectedRoute === 'recharge' ? 100 : 0;
      state.sensors.bypassValve = state.selectedRoute === 'bypass' ? 100 : 0;
      state.systemHealth = 98;

      if (state.routingMode === 'automatic') {
        state.selectedRoute = 'recharge';
        state.sensors.rechargeValve = 100;
      }

      showToast('GROUND CONDITIONS NORMALIZED — Recharge path available.', 'ok');
      AlertService.addAlert('info', 'FloodShield Standby', 'Ground conditions normalized (38% moisture). Recharge path restored.');
    }

    // Persist to Supabase Database
    if (ApiService && typeof ApiService.updateSystemState === 'function') {
      ApiService.updateSystemState({
        floodCondition: isFlood ? 'flood' : 'normal',
        systemStatus: state.status,
        selectedRoute: state.selectedRoute,
        rechargeEnabled: state.sensors.rechargeValve > 0,
        floodshieldActive: isFlood || state.selectedRoute === 'bypass',
        bypassActive: isFlood || state.selectedRoute === 'bypass',
        systemHealth: state.systemHealth
      }).catch(() => {});
    }

    SystemState.notify();
  }

  function showToast(msg, type) {
    const state = SystemState.getState();
    state.toastMessage = { msg, type, timestamp: Date.now() };
  }

  async function nextStage() {
    const state = SystemState.getState();
    if (state.currentStageIndex < SystemState.STAGES.length - 1) {
      state.currentStageIndex++;
      state.stageProgress = 0;
      state.stageActiveSeconds = 0;
      const currentStage = SystemState.STAGES[state.currentStageIndex];
      AlertService.addAlert('info', 'Manual Stage Advance', `Current stage set to ${currentStage.code} ${currentStage.name}`);
      
      if (ApiService && typeof ApiService.updateSystemState === 'function') {
        ApiService.updateSystemState({ currentStage: currentStage.name.toLowerCase() }).catch(() => {});
      }
      SystemState.notify();
    }
  }

  async function prevStage() {
    const state = SystemState.getState();
    if (state.currentStageIndex > 0) {
      state.currentStageIndex--;
      state.stageProgress = 0;
      state.stageActiveSeconds = 0;
      const currentStage = SystemState.STAGES[state.currentStageIndex];
      AlertService.addAlert('info', 'Manual Stage Return', `Current stage set to ${currentStage.code} ${currentStage.name}`);
      
      if (ApiService && typeof ApiService.updateSystemState === 'function') {
        ApiService.updateSystemState({ currentStage: currentStage.name.toLowerCase() }).catch(() => {});
      }
      SystemState.notify();
    }
  }

  async function setStageIndex(idx) {
    const state = SystemState.getState();
    if (idx >= 0 && idx < SystemState.STAGES.length) {
      state.currentStageIndex = idx;
      state.stageProgress = 0;
      state.stageActiveSeconds = 0;
      const currentStage = SystemState.STAGES[state.currentStageIndex];
      AlertService.addAlert('info', 'Stage Selected', `Switched to stage ${currentStage.code} ${currentStage.name}`);
      
      if (ApiService && typeof ApiService.updateSystemState === 'function') {
        ApiService.updateSystemState({ currentStage: currentStage.name.toLowerCase() }).catch(() => {});
      }
      SystemState.notify();
    }
  }

  function toggleAutoPlay() {
    const state = SystemState.getState();
    state.autoPlay = !state.autoPlay;
    AlertService.addAlert('info', 'Auto-Play Toggled', `Automatic stage progression: ${state.autoPlay ? 'ENABLED' : 'PAUSED'}`);
    SystemState.notify();
  }

  function togglePauseSimulation() {
    const state = SystemState.getState();
    state.isPaused = !state.isPaused;
    AlertService.addAlert('info', 'Simulation ' + (state.isPaused ? 'Paused' : 'Resumed'), `Telemetry engine ${state.isPaused ? 'paused' : 'resumed'}.`);
    SystemState.notify();
  }

  async function resetSystemDemo() {
    const state = SystemState.getState();
    state.status = 'OPERATIONAL';
    state.currentStageIndex = 0; // 01 COLLECTION
    state.stageProgress = 0;
    state.stageActiveSeconds = 0;
    state.floodMode = false;
    state.autoPlay = true;
    state.isPaused = false;
    state.selectedRoute = 'reuse';
    state.routingMode = 'manual';
    state.sensors.waterLevel = 64.0;
    state.sensors.flowRate = 4.8;
    state.sensors.soilMoisture = 38.0;
    state.sensors.floodSensor = 'NORMAL';
    state.sensors.rechargeStatus = 'ENABLED';
    state.sensors.rechargeValve = 0;
    state.sensors.bypassValve = 0;
    state.systemHealth = 98;
    
    AlertService.clearAlerts();
    AlertService.addAlert('info', 'System Reset', 'Monitoring simulation reset to initial collection state.');
    showToast('SYSTEM RESET: Monitoring simulation reset to initial state.', 'ok');

    if (ApiService && typeof ApiService.updateSystemState === 'function') {
      ApiService.updateSystemState({
        systemStatus: 'OPERATIONAL',
        currentStage: 'collection',
        routingMode: 'manual',
        selectedRoute: 'reuse',
        waterLevel: 64.0,
        flowRate: 4.8,
        floodCondition: 'normal',
        rechargeEnabled: true,
        floodshieldActive: false,
        bypassActive: false,
        systemHealth: 98
      }).catch(() => {});
    }

    SystemState.notify();
  }

  // Initialize Database state & start simulation ticker
  async function initSimulation() {
    // 1. Check Database Health & update UI badge
    const dbBadge = document.getElementById('db-status-badge');
    if (ApiService && typeof ApiService.getDatabaseHealth === 'function') {
      try {
        const health = await ApiService.getDatabaseHealth();
        if (health && health.database === 'connected') {
          if (dbBadge) {
            dbBadge.innerHTML = '● DATABASE CONNECTED';
            dbBadge.className = 'header-chip chip-online';
          }
          console.log('[SCADA] Supabase Database Connected & Operational.');
        } else {
          if (dbBadge) {
            dbBadge.innerHTML = '● DATABASE OFFLINE (FALLBACK)';
            dbBadge.className = 'header-chip chip-demo';
          }
        }
      } catch (_) {
        if (dbBadge) {
          dbBadge.innerHTML = '● LOCAL DEMO FALLBACK';
          dbBadge.className = 'header-chip chip-demo';
        }
      }
    }

    // 2. Fetch initial system state from Supabase
    if (ApiService && typeof ApiService.getSystemState === 'function') {
      try {
        const dbState = await ApiService.getSystemState();
        if (dbState && dbState.selectedRoute) {
          const state = SystemState.getState();
          state.selectedRoute = dbState.selectedRoute;
          state.routingMode = dbState.routingMode || 'manual';
          state.floodMode = dbState.floodCondition === 'flood';
          state.status = state.floodMode ? 'FLOOD_ACTIVE' : (dbState.systemStatus || 'OPERATIONAL');
          state.systemHealth = dbState.systemHealth || 98;
          if (dbState.waterLevel) state.sensors.waterLevel = dbState.waterLevel;
          if (dbState.flowRate) state.sensors.flowRate = dbState.flowRate;

          // Map current stage
          if (dbState.currentStage) {
            const stageIdx = SystemState.STAGES.findIndex(s => s.name.toLowerCase() === dbState.currentStage.toLowerCase());
            if (stageIdx !== -1) state.currentStageIndex = stageIdx;
          }

          // Update valves according to database route
          if (state.selectedRoute === 'reuse') {
            state.sensors.rechargeValve = 0;
            state.sensors.bypassValve = 0;
            state.sensors.rechargeStatus = state.floodMode ? 'BLOCKED' : 'STANDBY';
          } else if (state.selectedRoute === 'recharge') {
            state.sensors.rechargeValve = state.floodMode ? 0 : 100;
            state.sensors.bypassValve = 0;
            state.sensors.rechargeStatus = state.floodMode ? 'BLOCKED' : 'ENABLED';
          } else if (state.selectedRoute === 'bypass') {
            state.sensors.rechargeValve = 0;
            state.sensors.bypassValve = 100;
            state.sensors.rechargeStatus = 'BLOCKED';
          }

          SystemState.notify();
        }
      } catch (err) {
        console.warn('[SCADA] Could not fetch initial state from database, using defaults:', err.message);
      }
    }

    // 3. Fetch initial alerts from database
    if (ApiService && typeof ApiService.getAlerts === 'function') {
      try {
        const dbAlerts = await ApiService.getAlerts();
        if (Array.isArray(dbAlerts) && dbAlerts.length > 0) {
          AlertService.setAlerts(dbAlerts);
          SystemState.notify();
        }
      } catch (_) {}
    }

    // 4. Start ticker
    if (!simulationIntervalId) {
      simulationIntervalId = setInterval(simulationTick, 1500);
    }
  }

  // Hardware Abstraction API
  window.SimulationService = {
    initSimulation,
    setManualRoute,
    setRoutingMode,
    setFloodCondition,
    nextStage,
    prevStage,
    setStageIndex,
    toggleAutoPlay,
    togglePauseSimulation,
    resetSystemDemo,
    
    // Future REST / WebSocket hardware replacement interfaces
    getSystemStatus: () => Promise.resolve({ status: SystemState.getState().status, health: SystemState.getState().systemHealth }),
    getCurrentStage: () => Promise.resolve(SystemState.STAGES[SystemState.getState().currentStageIndex]),
    getSensorData: () => Promise.resolve({ ...SystemState.getState().sensors }),
    getWaterQuality: () => Promise.resolve({ ...SystemState.getState().waterQuality }),
    getAlerts: () => Promise.resolve(AlertService.getAlerts())
  };

})(window);
