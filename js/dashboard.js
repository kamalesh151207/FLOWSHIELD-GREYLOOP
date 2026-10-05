/**
 * FLOWSHIELD–GREYLOOP | Dashboard UI Renderer
 * Clean SCADA environmental monitoring layout, M3 Manual Routing Controls, and dynamic UI updates
 */

(function (window, document) {
  'use strict';

  const { SystemState, SensorService, AlertService, ChartManager, SchematicRenderer } = window;

  let activeView = 'overview';
  let toastTimeout = null;

  function setActiveView(viewName) {
    activeView = viewName;
    const pages = document.querySelectorAll('.view-page');
    pages.forEach(page => {
      if (page.id === `page-${viewName}`) {
        page.classList.add('active-page');
      } else {
        page.classList.remove('active-page');
      }
    });

    // Update page header title
    const headerTitle = document.querySelector('.header-title-group h2');
    const headerSub = document.querySelector('.header-title-group .sub');
    if (headerTitle && headerSub) {
      const titles = {
        'overview': { title: 'System Overview', sub: 'Real-time monitoring, M3 manual routing and operational status · ID: FGL-SIH26257-001' },
        'live-monitor': { title: 'Live Monitor', sub: 'Full-screen telemetry data stream' },
        'system-flow': { title: 'System Flow', sub: 'Complete engineering schematic & 3-way M3 destination routing' },
        'sensors': { title: 'Sensors Registry', sub: 'Hardware register table and live telemetry readings' },
        'water-quality': { title: 'Water Quality', sub: 'Discharge benchmarks & IS 10500 standards' },
        'floodshield': { title: 'FloodShield Protection', sub: 'Automated flood bypass mechanism & soak-pit protection' },
        'alerts': { title: 'Alert Center', sub: 'System event log & alarm management console' },
        'history': { title: 'Historical Log', sub: 'Session-based operational history & sensor trends' },
        'system-info': { title: 'System Specifications', sub: 'SIH26257 problem statement & project overview' }
      };
      if (titles[viewName]) {
        headerTitle.textContent = titles[viewName].title;
        headerSub.textContent = titles[viewName].sub;
      }
    }

    const state = SystemState.getState();
    if (viewName === 'overview') {
      SchematicRenderer.renderSchematic('svg-schematic-container', state);
    } else if (viewName === 'system-flow') {
      SchematicRenderer.renderSchematic('svg-flow-expanded-container', state);
    }
  }

  function getActiveView() {
    return activeView;
  }

  function render(state) {
    const currentStage = SystemState.STAGES[state.currentStageIndex];

    // 1. Top Status Information & KPI Cards
    renderKPICards(state, currentStage);

    // 2. Condition & Stage Buttons States
    renderControlsState(state);

    // 3. Render Schematic Cutaway SVG
    if (activeView === 'overview') {
      SchematicRenderer.renderSchematic('svg-schematic-container', state);
    } else if (activeView === 'system-flow') {
      SchematicRenderer.renderSchematic('svg-flow-expanded-container', state);
    }

    // 4. Timeline Stepper Bar
    renderTimelineBar(state);

    // 5. M3 Routing Control Panel & Status Cards
    renderM3RoutingPanel(state);

    // 6. Biofilter Cross-section Detail
    renderBiofilterDetail(state, currentStage);

    // 7. FloodShield Protection Card
    renderFloodCard(state);

    // 8. Live Sensor Grid (8 cards)
    renderSensorGrid(state);

    // 9. Water Quality Grid
    renderWaterQualityGrid(state);

    // 10. System Health Grid
    renderSystemHealthGrid(state);

    // 11. Event Alert Log Table
    renderAlertsTable();

    // 12. Sensors Hardware Register Table (Sensors View)
    renderSensorsPageTable(state);

    // 13. Historical Log Table (History View)
    renderHistoryPageTable(state);

    // 14. Toast Notification
    renderToast(state);

    // 15. Real-time Canvas Charts
    ChartManager.drawFlowChart('chart-flow-canvas', state.history);
    ChartManager.drawLevelChart('chart-level-canvas', state.history);
  }

  function renderKPICards(state, currentStage) {
    const valStatus = document.getElementById('kpi-status-val');
    const dotStatus = document.getElementById('kpi-status-dot');
    const subStatus = document.getElementById('kpi-status-sub');
    if (valStatus) {
      if (state.floodMode) {
        valStatus.textContent = 'FLOOD ACTIVE';
        valStatus.style.color = 'var(--status-red)';
        if (dotStatus) dotStatus.className = 'status-dot critical pulse';
        if (subStatus) subStatus.textContent = 'Bypass engaged';
      } else {
        valStatus.textContent = 'OPERATIONAL';
        valStatus.style.color = 'var(--status-green)';
        if (dotStatus) dotStatus.className = 'status-dot';
        if (subStatus) subStatus.textContent = 'Normal operation';
      }
    }

    const valStage = document.getElementById('kpi-stage-val');
    const subStage = document.getElementById('kpi-stage-sub');
    if (valStage) valStage.textContent = `${currentStage.code} ${currentStage.name}`;
    if (subStage) subStage.textContent = 'Treatment active';

    const valHealth = document.getElementById('kpi-health-val');
    if (valHealth) valHealth.textContent = `${state.systemHealth}%`;

    const valLevel = document.getElementById('kpi-level-val');
    if (valLevel) valLevel.textContent = `${typeof state.sensors.waterLevel === 'number' ? state.sensors.waterLevel.toFixed(1) : state.sensors.waterLevel}%`;

    const valFlow = document.getElementById('kpi-flow-val');
    if (valFlow) valFlow.textContent = `${typeof state.sensors.flowRate === 'number' ? state.sensors.flowRate.toFixed(1) : state.sensors.flowRate} L/min`;

    const valRecharge = document.getElementById('kpi-recharge-val');
    const subRecharge = document.getElementById('kpi-recharge-sub');
    if (valRecharge) {
      if (state.floodMode) {
        valRecharge.textContent = 'BLOCKED';
        valRecharge.style.color = 'var(--status-red)';
        if (subRecharge) subRecharge.textContent = 'Soil saturated (94%)';
      } else {
        if (state.selectedRoute === 'recharge') {
          valRecharge.textContent = 'RECHARGE ACTIVE';
          valRecharge.style.color = 'var(--status-green)';
          if (subRecharge) subRecharge.textContent = 'Aquifer infiltration bed';
        } else if (state.selectedRoute === 'bypass') {
          valRecharge.textContent = 'BYPASS ACTIVE';
          valRecharge.style.color = 'var(--status-red)';
          if (subRecharge) subRecharge.textContent = 'Storm drain diversion';
        } else {
          valRecharge.textContent = 'RECHARGE ENABLED';
          valRecharge.style.color = 'var(--status-green)';
          if (subRecharge) subRecharge.textContent = 'Ground conditions normal';
        }
      }
    }
  }

  function renderControlsState(state) {
    const btnNormal = document.getElementById('btn-cond-normal');
    const btnFlood = document.getElementById('btn-cond-flood');
    if (btnNormal && btnFlood) {
      if (state.floodMode) {
        btnNormal.className = 'btn-toggle';
        btnFlood.className = 'btn-toggle active-flood';
      } else {
        btnNormal.className = 'btn-toggle active-normal';
        btnFlood.className = 'btn-toggle';
      }
    }

    const btnPrev = document.getElementById('btn-prev-stage');
    const btnNext = document.getElementById('btn-next-stage');
    const btnAuto = document.getElementById('btn-autoplay');
    const btnPause = document.getElementById('btn-pause-sim');

    if (btnPrev) {
      btnPrev.disabled = state.currentStageIndex === 0;
      btnPrev.style.opacity = state.currentStageIndex === 0 ? '0.5' : '1';
      btnPrev.style.cursor = state.currentStageIndex === 0 ? 'not-allowed' : 'pointer';
    }

    if (btnNext) {
      btnNext.disabled = state.currentStageIndex === SystemState.STAGES.length - 1;
      btnNext.style.opacity = state.currentStageIndex === SystemState.STAGES.length - 1 ? '0.5' : '1';
      btnNext.style.cursor = state.currentStageIndex === SystemState.STAGES.length - 1 ? 'not-allowed' : 'pointer';
    }

    if (btnAuto) {
      btnAuto.innerHTML = state.autoPlay ? '⏸ PAUSE AUTO' : '▶ AUTO PLAY';
      btnAuto.className = state.autoPlay ? 'btn-action btn-primary' : 'btn-action';
    }

    if (btnPause) {
      btnPause.innerHTML = state.isPaused ? '▶ RESUME' : '⏸ PAUSE';
    }
  }

  function renderTimelineBar(state) {
    const bar = document.getElementById('timeline-bar');
    if (!bar) return;

    bar.innerHTML = SystemState.STAGES.map((st, idx) => {
      let cls = 'timeline-step';
      let statusText = 'UPCOMING';

      if (idx < state.currentStageIndex) {
        cls += ' completed';
        statusText = '✓ COMPLETED';
      } else if (idx === state.currentStageIndex) {
        cls += ' current';
        statusText = `● CURRENT (${state.stageProgress}%)`;
      }

      return `
        <div class="${cls}" data-stage-idx="${idx}">
          <span class="step-num">${st.code}</span>
          <div class="step-title">${st.name}</div>
          <div class="step-status">${statusText}</div>
        </div>
      `;
    }).join('');
  }

  function renderM3RoutingPanel(state) {
    const panel = document.getElementById('m3-routing-panel-content');
    if (!panel) return;

    const r = state.selectedRoute || 'reuse';
    const isFlood = state.floodMode;
    const mode = state.routingMode || 'manual';

    const routeDisplayName = {
      'reuse': 'REUSE',
      'recharge': 'GROUNDWATER RECHARGE',
      'bypass': 'FLOODSHIELD BYPASS'
    }[r] || 'REUSE';

    panel.innerHTML = `
      <div class="m3-panel-header">
        <div class="m3-title-box">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="m3-panel-title">M3 — WATER ROUTING</span>
            <span class="m3-badge-interactive">OPERATOR CONTROL</span>
          </div>
          <div class="m3-panel-sub">Select treated-water destination</div>
        </div>

        <div class="m3-mode-toggle-group">
          <span class="toggle-mini-lbl">ROUTING MODE:</span>
          <div class="btn-toggle-group">
            <button class="btn-toggle ${mode === 'manual' ? 'active-normal' : ''}" id="btn-mode-manual" onclick="window.SimulationService && window.SimulationService.setRoutingMode('manual')">MANUAL</button>
            <button class="btn-toggle ${mode === 'automatic' ? 'active-normal' : ''}" id="btn-mode-auto" onclick="window.SimulationService && window.SimulationService.setRoutingMode('automatic')">AUTOMATIC</button>
          </div>
        </div>
      </div>

      <!-- Compact 3-Way Control Buttons (Height 52-60px) -->
      <div class="m3-controls-grid">
        <!-- Button 1: REUSE -->
        <button class="route-btn ${r === 'reuse' ? 'active-reuse' : ''}" 
                id="btn-route-reuse" 
                title="Direct treated-water reuse for toilet flushing & landscape irrigation" 
                onclick="window.SimulationService && window.SimulationService.setManualRoute('reuse')">
          <div class="route-btn-left">
            <span class="route-btn-icon" style="background:#EFF6FF; color:#2563EB;">💧</span>
            <div class="route-btn-text">
              <span class="route-btn-name">REUSE</span>
              <span class="route-btn-sub">Direct Non-Potable Reuse</span>
            </div>
          </div>
          <span class="route-btn-status ${r === 'reuse' ? 'st-active' : 'st-avail'}">
            ${r === 'reuse' ? '● ACTIVE' : '○ AVAILABLE'}
          </span>
        </button>

        <!-- Button 2: GROUNDWATER RECHARGE -->
        <button class="route-btn ${isFlood ? 'disabled-blocked' : (r === 'recharge' ? 'active-recharge' : '')}" 
                id="btn-route-recharge" 
                title="${isFlood ? 'Blocked — Saturated soil / flood condition' : 'Sub-surface aquifer recharge'}" 
                ${isFlood ? 'disabled' : ''} 
                onclick="${isFlood ? '' : "window.SimulationService && window.SimulationService.setManualRoute('recharge')"}">
          <div class="route-btn-left">
            <span class="route-btn-icon" style="background:${isFlood ? '#FEE2E2' : '#F0FDF4'}; color:${isFlood ? '#DC2626' : '#16A34A'};">♻</span>
            <div class="route-btn-text">
              <span class="route-btn-name" style="${isFlood ? 'color:var(--status-red);' : ''}">RECHARGE</span>
              <span class="route-btn-sub">${isFlood ? 'Blocked (Flood Active)' : 'Aquifer Infiltration'}</span>
            </div>
          </div>
          <span class="route-btn-status ${isFlood ? 'st-blocked' : (r === 'recharge' ? 'st-active' : 'st-avail')}">
            ${isFlood ? '✕ BLOCKED' : (r === 'recharge' ? '● ACTIVE' : '○ AVAILABLE')}
          </span>
        </button>

        <!-- Button 3: FLOODSHIELD BYPASS -->
        <button class="route-btn ${r === 'bypass' ? 'active-bypass' : ''}" 
                id="btn-route-bypass" 
                title="Controlled stormwater bypass during heavy rains / flood" 
                onclick="window.SimulationService && window.SimulationService.setManualRoute('bypass')">
          <div class="route-btn-left">
            <span class="route-btn-icon" style="background:#FEF2F2; color:#DC2626;">🛡</span>
            <div class="route-btn-text">
              <span class="route-btn-name" style="${r === 'bypass' ? 'color:var(--status-red);' : ''}">FLOODSHIELD BYPASS</span>
              <span class="route-btn-sub">Controlled Diversion</span>
            </div>
          </div>
          <span class="route-btn-status ${r === 'bypass' ? 'st-bypass-active' : 'st-standby'}">
            ${r === 'bypass' ? '● ACTIVE DIVERSION' : '○ STANDBY'}
          </span>
        </button>
      </div>

      <!-- Compact Horizontal Routing Status Row -->
      <div class="m3-status-strip">
        <div class="m3-status-item">
          <span class="m3-lbl">M3 ROUTE</span>
          <span class="m3-val" style="color:${r === 'bypass' ? 'var(--status-red)' : (r === 'recharge' ? 'var(--status-green)' : 'var(--blue-secondary)')};">${routeDisplayName}</span>
        </div>
        <div class="m3-status-item">
          <span class="m3-lbl">ROUTE STATUS</span>
          <span class="m3-val" style="color:var(--status-green);">ACTIVE</span>
        </div>
        <div class="m3-status-item">
          <span class="m3-lbl">CONTROL MODE</span>
          <span class="m3-val">${isFlood ? 'SAFETY OVERRIDE' : (mode === 'manual' ? 'MANUAL' : 'SIMULATED AUTOMATIC LOGIC')}</span>
        </div>
        <div class="m3-status-item">
          <span class="m3-lbl">SYSTEM CONDITION</span>
          <span class="m3-val" style="color:${isFlood ? 'var(--status-red)' : 'var(--status-green)'};">${isFlood ? 'FLOOD DETECTED' : 'NORMAL (38% MOISTURE)'}</span>
        </div>
      </div>
    `;
  }

  function renderBiofilterDetail(state, currentStage) {
    const container = document.getElementById('biofilter-detail-content');
    if (!container) return;

    container.innerHTML = `
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.4; margin-bottom:8px;">
        ${currentStage.name === 'BIOFILTER' ? 'Organic media and plant-based filtration are currently treating greywater through the vertical modular filter.' : currentStage.desc}
      </div>
      <div class="biofilter-layers-stack">
        <div class="bio-layer-item">
          <span class="bio-layer-name">Top Distribution Layer</span>
          <span class="bio-layer-type">Perforated Manifold</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Biochar Media Layer</span>
          <span class="bio-layer-type">High Surface Area Adsorption</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Coco Coir & Bagasse Layer</span>
          <span class="bio-layer-type">Organic Microbial Substrate</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Rice Husk & Straw Matrix</span>
          <span class="bio-layer-type">Agricultural Waste Filter</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Sand & Fine Media Layer</span>
          <span class="bio-layer-type">Fine Particle Polishing</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Gravel Support Layer</span>
          <span class="bio-layer-type">Hydraulic Base Drainage</span>
        </div>
        <div class="bio-layer-item" style="border-left-color:var(--status-green);">
          <span class="bio-layer-name">Phytoremediation Plant Root Zone</span>
          <span class="bio-layer-type">Canna / Vetiver / Napier</span>
        </div>
      </div>
      <div style="font-size:10px; color:var(--text-muted); margin-top:6px; font-family:var(--font-mono);">
        * Prototype media configuration — DEMO CONFIGURATION
      </div>
    `;
  }

  function renderFloodCard(state) {
    const card = document.getElementById('floodshield-panel');
    if (!card) return;

    if (state.floodMode) {
      card.className = 'floodshield-card active-alert';
      card.innerHTML = `
        <div class="card-header-clean">
          <h4 style="color:var(--status-red);">FLOODSHIELD PROTECTION — ACTIVE</h4>
          <span class="kpi-status-tag crit">FLOOD DETECTED</span>
        </div>
        <div class="flood-state-box">
          <div class="flood-icon-circle">⚠</div>
          <div class="flood-state-text">
            <h5 style="color:var(--status-red);">FLOOD CONDITION DETECTED</h5>
            <p>Recharge blocked automatically · Water routing to bypass</p>
          </div>
        </div>
        <div class="flood-metrics-row">
          <div class="flood-metric-box">
            <div class="flood-metric-lbl">RECHARGE STATUS</div>
            <div class="flood-metric-val" style="color:var(--status-red);">BLOCKED (0%)</div>
          </div>
          <div class="flood-metric-box">
            <div class="flood-metric-lbl">BYPASS ROUTING</div>
            <div class="flood-metric-val" style="color:var(--blue-secondary);">ACTIVE (100%)</div>
          </div>
        </div>
        <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4;">
          Soil moisture sensor triggered at 94% saturation. Automated valve has isolated the soak-pit recharge bed to prevent backflow contamination into surrounding areas.
        </p>
      `;
    } else {
      card.className = 'floodshield-card';
      card.innerHTML = `
        <div class="card-header-clean">
          <h4>FLOODSHIELD PROTECTION</h4>
          <span class="kpi-status-tag ok">GROUND SUITABLE</span>
        </div>
        <div class="flood-state-box">
          <div class="flood-icon-circle">✓</div>
          <div class="flood-state-text">
            <h5>GROUND CONDITIONS SUITABLE</h5>
            <p>Controlled sub-surface aquifer recharge enabled</p>
          </div>
        </div>
        <div class="flood-metrics-row">
          <div class="flood-metric-box">
            <div class="flood-metric-lbl">RECHARGE STATUS</div>
            <div class="flood-metric-val" style="color:var(--status-green);">ENABLED (100%)</div>
          </div>
          <div class="flood-metric-box">
            <div class="flood-metric-lbl">BYPASS ROUTING</div>
            <div class="flood-metric-val" style="color:var(--text-secondary);">STANDBY (0%)</div>
          </div>
        </div>
        <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4;">
          Capacitive soil probe indicates 38% moisture. Infiltration capacity is optimal for groundwater replenishment without overflow hazard.
        </p>
      `;
    }
  }

  function renderSensorGrid(state) {
    const grid = document.getElementById('sensor-grid');
    if (!grid) return;

    const cardsData = SensorService.getSensorCardsData(state);
    grid.innerHTML = cardsData.map(s => `
      <div class="sensor-card">
        <div class="sensor-card-top">
          <span class="sensor-name">${s.name}</span>
          <span class="sensor-badge ${s.cls}">${s.status}</span>
        </div>
        <div class="sensor-value-row">
          <span class="sensor-val">${s.val}</span>
          <span class="sensor-unit">${s.unit}</span>
        </div>
        <div class="sensor-card-bottom">
          <span>Updated just now</span>
          <span class="demo-tag">DEMO DATA</span>
        </div>
      </div>
    `).join('');
  }

  function renderWaterQualityGrid(state) {
    const grid = document.getElementById('quality-grid');
    if (!grid) return;

    const params = [
      { name: 'pH Level', val: `${state.waterQuality.pH.val}`, unit: '', standard: '6.5 – 8.5' },
      { name: 'Turbidity', val: `${state.waterQuality.turbidity.val}`, unit: 'NTU', standard: '< 5 NTU' },
      { name: 'TSS (Total Suspended Solids)', val: `${state.waterQuality.tss.val}`, unit: 'mg/L', standard: '< 20 mg/L' },
      { name: 'COD (Chemical Oxygen Demand)', val: `${state.waterQuality.cod.val}`, unit: 'mg/L', standard: '< 50 mg/L' },
      { name: 'BOD (Biochemical Oxygen Demand)', val: `${state.waterQuality.bod.val}`, unit: 'mg/L', standard: '< 10 mg/L' },
      { name: 'Oil & Grease', val: `${state.waterQuality.oilGrease.val}`, unit: 'mg/L', standard: '< 5 mg/L' }
    ];

    grid.innerHTML = params.map(p => `
      <div class="param-card">
        <div class="param-name">
          <span>${p.name}</span>
          <span class="demo-tag">DEMO DATA</span>
        </div>
        <div style="display:flex; align-items:baseline; justify-content:space-between; margin-top:4px;">
          <div style="font-size:18px; font-weight:700; color:var(--navy-primary); font-family:var(--font-mono);">
            ${p.val} <span style="font-size:11px; color:var(--text-secondary);">${p.unit}</span>
          </div>
          <div style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono);">
            IS Standard: ${p.standard}
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderSystemHealthGrid(state) {
    const grid = document.getElementById('health-grid');
    if (!grid) return;

    const devices = [
      { name: 'ESP32 CONTROLLER', status: 'ONLINE' },
      { name: 'WATER LEVEL SENSOR', status: 'ONLINE' },
      { name: 'FLOW SENSOR', status: 'ONLINE' },
      { name: 'FLOOD SENSOR', status: 'ONLINE' },
      { name: 'CONTROL VALVE', status: 'ONLINE' },
      { name: 'DATA SERVICE', status: 'ONLINE' }
    ];

    grid.innerHTML = devices.map(d => `
      <div class="health-item">
        <span class="health-name">${d.name}</span>
        <span class="health-status"><span class="status-dot"></span> ${d.status}</span>
      </div>
    `).join('');
  }

  function renderAlertsTable() {
    const tableBody = document.getElementById('events-tbody');
    if (!tableBody) return;

    const alerts = AlertService.getAlerts();
    if (alerts.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">System Normal — No active critical alerts logged</td></tr>`;
      return;
    }

    tableBody.innerHTML = alerts.slice(0, 5).map(al => `
      <tr>
        <td style="color:var(--text-secondary); font-family:var(--font-mono); font-weight:600;">${al.time}</td>
        <td><span class="sev-tag ${al.severity}">${al.severity.toUpperCase()}</span></td>
        <td style="font-weight:700; color:var(--navy-primary);">${al.title}</td>
        <td style="color:var(--text-secondary);">${al.msg}</td>
      </tr>
    `).join('');
  }

  function renderSensorsPageTable(state) {
    const tbody = document.getElementById('sensor-table-body');
    if (!tbody) return;

    const registry = SensorService.getSensorRegistry(state);
    tbody.innerHTML = registry.map(r => `
      <tr>
        <td style="font-weight:700; color:var(--navy-primary);">${r.name}</td>
        <td style="color:var(--text-secondary);">${r.location}</td>
        <td style="color:var(--blue-secondary); font-family:var(--font-mono); font-weight:700;">${r.value} ${r.unit}</td>
        <td><span class="sev-tag ${r.status.includes('CRITICAL') ? 'critical' : 'info'}">${r.status}</span></td>
        <td style="color:var(--text-muted); font-size:11px;">${r.update}</td>
        <td><span class="kpi-status-tag ok">${r.connection}</span></td>
      </tr>
    `).join('');
  }

  let dbHistoryCache = null;
  let lastHistoryFetch = 0;

  async function renderHistoryPageTable(state) {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    const r = state.selectedRoute || 'reuse';

    // Fetch from API every 10 seconds if on history view
    const now = Date.now();
    if (window.ApiService && typeof window.ApiService.getHistory === 'function' && (now - lastHistoryFetch > 10000 || !dbHistoryCache)) {
      lastHistoryFetch = now;
      try {
        const data = await window.ApiService.getHistory(20);
        if (Array.isArray(data) && data.length > 0) {
          dbHistoryCache = data;
        }
      } catch (_) {}
    }

    if (dbHistoryCache && dbHistoryCache.length > 0) {
      tbody.innerHTML = dbHistoryCache.map(row => {
        const timeStr = row.recorded_at ? new Date(row.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '21:40:00';
        return `
          <tr>
            <td style="font-family:var(--font-mono); color:var(--text-secondary);">${timeStr}</td>
            <td style="font-weight:700; color:var(--navy-primary);">TELEMETRY LOG</td>
            <td>${row.system_stage || 'BIOFILTER'}</td>
            <td style="font-family:var(--font-mono); font-weight:700; color:var(--blue-secondary);">${(row.selected_route || 'reuse').toUpperCase()}</td>
            <td><span class="kpi-status-tag ${row.flood_condition === 'flood' ? 'crit' : 'ok'}">${(row.flood_condition || 'normal').toUpperCase()}</span></td>
            <td style="font-family:var(--font-mono);">${state.routingMode.toUpperCase()}</td>
          </tr>
        `;
      }).join('');
      return;
    }

    const rows = [
      { time: '21:43:12', event: 'M3 ROUTE SELECTION', stage: 'M3 ROUTING', route: r.toUpperCase(), flood: state.floodMode ? 'DETECTED' : 'NORMAL', mode: state.routingMode.toUpperCase() },
      { time: '21:40:00', event: 'STAGE ADVANCE', stage: '04 BIOFILTER', route: 'REUSE', flood: 'NORMAL', mode: 'MANUAL' },
      { time: '21:35:00', event: 'STAGE ADVANCE', stage: '03 SETTLING', route: 'REUSE', flood: 'NORMAL', mode: 'MANUAL' },
      { time: '21:20:00', event: 'STAGE ADVANCE', stage: '02 PREFILTER', route: 'REUSE', flood: 'NORMAL', mode: 'MANUAL' },
      { time: '21:05:00', event: 'SYSTEM START', stage: '01 COLLECTION', route: 'REUSE', flood: 'NORMAL', mode: 'MANUAL' }
    ];

    tbody.innerHTML = rows.map(row => `
      <tr>
        <td style="font-family:var(--font-mono); color:var(--text-secondary);">${row.time}</td>
        <td style="font-weight:700; color:var(--navy-primary);">${row.event}</td>
        <td>${row.stage}</td>
        <td style="font-family:var(--font-mono); font-weight:700; color:var(--blue-secondary);">${row.route}</td>
        <td><span class="kpi-status-tag ${row.flood === 'DETECTED' ? 'crit' : 'ok'}">${row.flood}</span></td>
        <td style="font-family:var(--font-mono);">${row.mode}</td>
      </tr>
    `).join('');
  }

  function renderToast(state) {
    const toastEl = document.getElementById('dashboard-toast');
    if (!toastEl) return;

    if (state.toastMessage) {
      toastEl.textContent = state.toastMessage.msg;
      toastEl.className = `dashboard-toast show toast-${state.toastMessage.type}`;
      
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toastEl.className = 'dashboard-toast';
        state.toastMessage = null;
      }, 4000);
    }
  }

  window.Dashboard = {
    setActiveView,
    getActiveView,
    render
  };

})(window, document);
