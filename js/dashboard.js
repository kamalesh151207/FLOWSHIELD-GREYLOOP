/**
 * FLOWSHIELD–GREYLOOP | Master Dashboard UI Renderer
 * Clean SCADA environmental monitoring layout, dynamic multi-view rendering,
 * Live Greywater Treatment Stage Indicator, and interactive controls.
 */

(function (window, document) {
  'use strict';

  const { SystemState, SensorService, AlertService, ChartManager, SchematicRenderer } = window;

  let activeView = 'overview';
  let toastTimeout = null;

  function setActiveView(viewName) {
    if (!viewName) return;
    activeView = viewName;

    // Switch active view container
    const pages = document.querySelectorAll('.view-page');
    pages.forEach(page => {
      if (page.id === `page-${viewName}`) {
        page.classList.add('active-page');
      } else {
        page.classList.remove('active-page');
      }
    });

    // Update sidebar active item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.dataset.view === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update page header title & subtitle
    const headerTitle = document.querySelector('.header-title-group h2');
    const headerSub = document.querySelector('.header-title-group .sub');
    if (headerTitle && headerSub) {
      const titles = {
        'overview': { title: 'System Overview', sub: 'Real-time monitoring, M3 manual routing and operational status · ID: FGL-SIH26257-001' },
        'live-monitor': { title: 'Live Telemetry Monitor', sub: 'Continuous high-frequency operational telemetry data stream' },
        'system-flow': { title: 'System Flow & Decision Logic', sub: 'Physical 6-stage greywater treatment sequence and automated FloodShield diversion routing' },
        'sensors': { title: 'Sensor Hardware Register', sub: 'Hardware register table, diagnostic status, and live telemetry readings' },
        'water-quality': { title: 'Water Quality & Standards', sub: '3-Stage effluent parameters monitored against IS 10500 / CPCB non-potable reuse norms' },
        'floodshield': { title: 'FloodShield Protection Center', sub: 'Automated flood bypass mechanism, soil saturation sensing & soak-pit protection' },
        'alerts': { title: 'Alert Center & Alarm Log', sub: 'System event log, severity categorization & alarm management console' },
        'history': { title: 'Historical Monitoring Log', sub: 'Session-based SCADA operational history, telemetry snapshots & CSV export' },
        'system-info': { title: 'System Specifications', sub: 'SIH26257 problem statement, biomass filtration media & technical architecture' }
      };
      if (titles[viewName]) {
        headerTitle.textContent = titles[viewName].title;
        headerSub.textContent = titles[viewName].sub;
      }
    }

    // Immediately render the view
    if (window.SystemState) {
      render(window.SystemState.getState());
    }
  }

  function getActiveView() {
    return activeView;
  }

  function render(state) {
    if (!state) return;
    const currentStage = SystemState.STAGES[state.currentStageIndex] || SystemState.STAGES[0];

    // Always update header indicators
    updateHeaderChips(state);

    // 1. Render Overview View
    renderOverviewPage(state, currentStage);

    // 2. Render Live Monitor View
    renderLiveMonitorPage(state, currentStage);

    // 3. Render System Flow View
    renderSystemFlowPage(state, currentStage);

    // 4. Render Sensors View
    renderSensorsPage(state);

    // 5. Render Water Quality View
    renderWaterQualityPage(state);

    // 6. Render FloodShield View
    renderFloodShieldPage(state);

    // 7. Render Alerts View
    renderAlertsPage(state);

    // 8. Render History View
    renderHistoryPage(state);

    // 9. Render System Info View
    renderSystemInfoPage(state);

    // 10. Toast Notification
    renderToast(state);
  }

  function updateHeaderChips(state) {
    const clockEl = document.getElementById('header-clock');
    if (clockEl && !clockEl.textContent.trim()) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     01. OVERVIEW PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderOverviewPage(state, currentStage) {
    // 1. Schematic Canvas
    if (activeView === 'overview') {
      SchematicRenderer.renderSchematic('svg-schematic-container', state);
    }

    // 2. LIVE GREYWATER TREATMENT STAGE BANNER (Prominently placed near System Flow)
    renderLiveTreatmentStageBanner(state, currentStage);

    // 3. Top Status Information & KPI Cards
    renderKPICards(state, currentStage);

    // 4. Condition & Stage Buttons States
    renderControlsState(state);

    // 5. Timeline Stepper Bar
    renderTimelineBar(state);

    // 6. M3 Routing Control Panel
    renderM3RoutingPanel(state);

    // 7. Biofilter Cross-section Detail
    renderBiofilterDetail(state, currentStage);

    // 8. FloodShield Protection Card
    renderFloodCard(state);

    // 9. Live Sensor Grid (8 cards)
    renderSensorGrid(state);

    // 10. Real-time Canvas Charts
    if (activeView === 'overview') {
      ChartManager.drawFlowChart('chart-flow-canvas', state.history);
      ChartManager.drawLevelChart('chart-level-canvas', state.history);
    }

    // 11. Water Quality & System Health Preview Grids
    renderWaterQualityOverviewGrid(state);
    renderSystemHealthGrid(state);

    // 12. Alert Center & Operational Log Table Preview
    renderAlertsOverviewTable();
  }

  function renderLiveTreatmentStageBanner(state, currentStage) {
    const container = document.getElementById('live-treatment-stage-banner');
    if (!container) return;

    const isFlood = state.floodMode;
    const isBio = currentStage.key === 'biofilter';

    container.innerHTML = `
      <div class="live-stage-card ${isFlood ? 'flood-active' : ''}">
        <div class="live-stage-left">
          <div class="stage-section-badge">CURRENT GREYWATER STAGE</div>
          <div class="stage-hero-heading">
            <span class="stage-number-tag">STAGE ${currentStage.code}</span>
            <span class="stage-name-text">${currentStage.name}</span>
          </div>
          <div class="stage-status-row">
            <span class="status-dot ${isFlood ? 'critical' : ''} pulse"></span>
            <span class="stage-status-title">${currentStage.statusText}</span>
            <span class="stage-status-sub">· Water currently passing through ${currentStage.shortName.toLowerCase()}</span>
          </div>
        </div>

        <div class="live-stage-right">
          <div class="stage-desc-text">
            "${currentStage.detail}"
          </div>
          <div class="stage-flow-tracker">
            ${SystemState.STAGES.map((s, idx) => {
              const isDone = idx < state.currentStageIndex;
              const isCurr = idx === state.currentStageIndex;
              return `
                <div class="tracker-node ${isDone ? 'done' : (isCurr ? 'curr' : 'upcoming')}" onclick="window.SimulationService && window.SimulationService.setStageIndex(${idx})">
                  <span class="tracker-dot">${isDone ? '✓' : (isCurr ? '●' : s.code)}</span>
                  <span class="tracker-name">${s.shortName}</span>
                </div>
                ${idx < SystemState.STAGES.length - 1 ? '<span class="tracker-arrow">→</span>' : ''}
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderKPICards(state, currentStage) {
    const valStatus = document.getElementById('kpi-status-val');
    const dotStatus = document.getElementById('kpi-status-dot');
    const subStatus = document.getElementById('kpi-status-sub');
    if (valStatus) {
      if (state.floodMode) {
        valStatus.innerHTML = '<span class="status-dot critical pulse"></span> FLOOD ACTIVE';
        valStatus.style.color = 'var(--status-red)';
        if (subStatus) subStatus.textContent = 'Bypass engaged · Recharge blocked';
      } else {
        valStatus.innerHTML = '<span class="status-dot"></span> OPERATIONAL';
        valStatus.style.color = 'var(--status-green)';
        if (subStatus) subStatus.textContent = 'Normal operation · SCADA Nominal';
      }
    }

    const valStage = document.getElementById('kpi-stage-val');
    const subStage = document.getElementById('kpi-stage-sub');
    if (valStage) valStage.textContent = `${currentStage.code} ${currentStage.shortName}`;
    if (subStage) subStage.textContent = currentStage.statusText;

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
        valRecharge.textContent = 'RECHARGE BLOCKED';
        valRecharge.style.color = 'var(--status-red)';
        if (subRecharge) subRecharge.textContent = 'Soil saturated (94%)';
      } else {
        if (state.selectedRoute === 'recharge') {
          valRecharge.textContent = 'RECHARGE ACTIVE';
          valRecharge.style.color = 'var(--status-green)';
          if (subRecharge) subRecharge.textContent = 'Aquifer infiltration bed';
        } else if (state.selectedRoute === 'bypass') {
          valRecharge.textContent = 'BYPASS ACTIVE';
          valRecharge.style.color = 'var(--status-amber)';
          if (subRecharge) subRecharge.textContent = 'Controlled stormwater diversion';
        } else {
          valRecharge.textContent = 'RECHARGE ENABLED';
          valRecharge.style.color = 'var(--status-green)';
          if (subRecharge) subRecharge.textContent = 'Ground conditions nominal (38%)';
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
      btnPause.className = state.isPaused ? 'btn-action btn-warn' : 'btn-action';
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
        <div class="${cls}" data-stage-idx="${idx}" onclick="window.SimulationService && window.SimulationService.setStageIndex(${idx})">
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
            <span class="m3-panel-title">M3 — WATER ROUTING CONTROLS</span>
            <span class="m3-badge-interactive">OPERATOR CONTROL ROOM</span>
          </div>
          <div class="m3-panel-sub">Select treated-water destination pathway (Reuse, Recharge, or FloodShield Bypass)</div>
        </div>

        <div class="m3-mode-toggle-group">
          <span class="toggle-mini-lbl">ROUTING MODE:</span>
          <div class="btn-toggle-group">
            <button class="btn-toggle ${mode === 'manual' ? 'active-normal' : ''}" id="btn-mode-manual" onclick="window.SimulationService && window.SimulationService.setRoutingMode('manual')">MANUAL</button>
            <button class="btn-toggle ${mode === 'automatic' ? 'active-normal' : ''}" id="btn-mode-auto" onclick="window.SimulationService && window.SimulationService.setRoutingMode('automatic')">AUTOMATIC</button>
          </div>
        </div>
      </div>

      <!-- 3-Way Control Buttons -->
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
              <span class="route-btn-sub">Direct Non-Potable Distribution</span>
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
              <span class="route-btn-sub">${isFlood ? 'Blocked (Soil Saturated 94%)' : 'Aquifer Infiltration Bed'}</span>
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
              <span class="route-btn-sub">Raised Stormwater Diversion</span>
            </div>
          </div>
          <span class="route-btn-status ${r === 'bypass' ? 'st-bypass-active' : 'st-standby'}">
            ${r === 'bypass' ? '● ACTIVE DIVERSION' : '○ STANDBY'}
          </span>
        </button>
      </div>

      <!-- Horizontal Routing Status Row -->
      <div class="m3-status-strip">
        <div class="m3-status-item">
          <span class="m3-lbl">ACTIVE M3 ROUTE</span>
          <span class="m3-val" style="color:${r === 'bypass' ? 'var(--status-red)' : (r === 'recharge' ? 'var(--status-green)' : 'var(--blue-secondary)')};">${routeDisplayName}</span>
        </div>
        <div class="m3-status-item">
          <span class="m3-lbl">ROUTE STATUS</span>
          <span class="m3-val" style="color:var(--status-green);">ACTIVE DISPATCH</span>
        </div>
        <div class="m3-status-item">
          <span class="m3-lbl">CONTROL MODE</span>
          <span class="m3-val">${isFlood ? 'SAFETY OVERRIDE' : (mode === 'manual' ? 'MANUAL' : 'DYNAMIC LOGIC')}</span>
        </div>
        <div class="m3-status-item">
          <span class="m3-lbl">SOIL CONDITION</span>
          <span class="m3-val" style="color:${isFlood ? 'var(--status-red)' : 'var(--status-green)'};">${isFlood ? 'SATURATED (94% MOISTURE)' : 'SUITABLE (38% MOISTURE)'}</span>
        </div>
      </div>
    `;
  }

  function renderBiofilterDetail(state, currentStage) {
    const container = document.getElementById('biofilter-detail-content');
    if (!container) return;

    container.innerHTML = `
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.4; margin-bottom:8px;">
        ${currentStage.name === 'VERTICAL BIOFILTER' ? 'Organic agricultural biomass and phytoremediation plants are actively polishing greywater through the vertical modular filter column.' : currentStage.desc}
      </div>
      <div class="biofilter-layers-stack">
        <div class="bio-layer-item">
          <span class="bio-layer-name">Top Distribution Manifold</span>
          <span class="bio-layer-type">Perforated Diffuser</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Biochar Media Layer</span>
          <span class="bio-layer-type">Microporous Adsorption</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Coco Coir & Sugarcane Bagasse Layer</span>
          <span class="bio-layer-type">Aerobic Microbial Substrate</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Rice Husk & Agricultural Straw Matrix</span>
          <span class="bio-layer-type">Fine Suspended Solids Trap</span>
        </div>
        <div class="bio-layer-item">
          <span class="bio-layer-name">Graded Sand & River Gravel Layer</span>
          <span class="bio-layer-type">Polishing & Hydraulic Base</span>
        </div>
        <div class="bio-layer-item" style="border-left-color:var(--status-green);">
          <span class="bio-layer-name">Phytoremediation Plant Root Zone</span>
          <span class="bio-layer-type">Vetiver / Canna / Typha</span>
        </div>
      </div>
      <div style="font-size:10px; color:var(--text-muted); margin-top:6px; font-family:var(--font-mono);">
        * Multi-layer biofilter architecture designed for SIH26257 minimal-footprint rural installation.
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
            <h5 style="color:var(--status-red);">FLOOD / SATURATED CONDITION DETECTED</h5>
            <p>Recharge blocked automatically · Water diverted safely to FloodShield bypass</p>
          </div>
        </div>
        <div class="flood-metrics-row">
          <div class="flood-metric-box">
            <div class="flood-metric-lbl">RECHARGE VALVE</div>
            <div class="flood-metric-val" style="color:var(--status-red);">0% (BLOCKED)</div>
          </div>
          <div class="flood-metric-box">
            <div class="flood-metric-lbl">BYPASS GATE</div>
            <div class="flood-metric-val" style="color:var(--blue-secondary);">100% (ACTIVE)</div>
          </div>
        </div>
        <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4;">
          Capacitive soil moisture sensor triggered at 94% saturation (>85% limit). Motorized valve isolated infiltration bed to protect soak pit from overflow contamination.
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
            <div class="flood-metric-lbl">RECHARGE PATH</div>
            <div class="flood-metric-val" style="color:var(--status-green);">ENABLED (100%)</div>
          </div>
          <div class="flood-metric-box">
            <div class="flood-metric-lbl">BYPASS GATE</div>
            <div class="flood-metric-val" style="color:var(--text-secondary);">STANDBY (0%)</div>
          </div>
        </div>
        <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4;">
          Capacitive soil probe indicates 38% moisture. Infiltration capacity is optimal for groundwater replenishment without waterlogging risk.
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
          <span class="demo-tag">DEMO TELEMETRY</span>
        </div>
      </div>
    `).join('');
  }

  function renderWaterQualityOverviewGrid(state) {
    const grid = document.getElementById('quality-grid');
    if (!grid) return;

    const params = [
      { name: 'pH Level', val: `${state.sensors.ph || '7.2'}`, unit: '', standard: '6.5 – 8.5' },
      { name: 'Turbidity', val: `${state.sensors.turbidity || '3.2'}`, unit: 'NTU', standard: '< 5.0 NTU' },
      { name: 'TSS (Solids)', val: `${state.sensors.tss || '12'}`, unit: 'mg/L', standard: '< 20 mg/L' },
      { name: 'COD', val: `${state.sensors.cod || '32'}`, unit: 'mg/L', standard: '< 50 mg/L' },
      { name: 'BOD₅', val: `${state.sensors.bod || '7.8'}`, unit: 'mg/L', standard: '< 10 mg/L' },
      { name: 'DO (Oxygen)', val: `${state.sensors.do || '5.4'}`, unit: 'mg/L', standard: '> 4.0 mg/L' }
    ];

    grid.innerHTML = params.map(p => `
      <div class="param-card">
        <div class="param-name">
          <span>${p.name}</span>
          <span class="demo-tag">DEMO DATA</span>
        </div>
        <div style="display:flex; align-items:baseline; justify-content:space-between; margin-top:4px;">
          <div style="font-size:17px; font-weight:700; color:var(--navy-primary); font-family:var(--font-mono);">
            ${p.val} <span style="font-size:11px; color:var(--text-secondary);">${p.unit}</span>
          </div>
          <div style="font-size:9.5px; color:var(--text-muted); font-family:var(--font-mono);">
            Target: ${p.standard}
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderSystemHealthGrid(state) {
    const grid = document.getElementById('health-grid');
    if (!grid) return;

    const devices = [
      { name: 'ESP32 MCU CONTROLLER', status: 'ONLINE', bus: 'WiFi/MQTT' },
      { name: 'WATER LEVEL SENSOR', status: 'ONLINE', bus: 'GPIO ADC' },
      { name: 'FLOW RATE METER', status: 'ONLINE', bus: 'Pulse Pin' },
      { name: 'SOIL MOISTURE PROBE', status: 'ONLINE', bus: 'Analog ADC' },
      { name: 'RECHARGE ACTUATOR', status: 'ONLINE', bus: 'Relay 24V' },
      { name: 'SUPABASE POSTGRES GATEWAY', status: 'ONLINE', bus: 'REST API' }
    ];

    grid.innerHTML = devices.map(d => `
      <div class="health-item">
        <div>
          <span class="health-name">${d.name}</span>
          <span style="display:block; font-size:9px; color:var(--text-muted); font-family:var(--font-mono);">${d.bus}</span>
        </div>
        <span class="health-status"><span class="status-dot"></span> ${d.status}</span>
      </div>
    `).join('');
  }

  function renderAlertsOverviewTable() {
    const tableBody = document.getElementById('events-tbody');
    if (!tableBody) return;

    const alerts = AlertService.getAlerts('ALL');
    if (alerts.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">System Normal — No active alerts logged.</td></tr>`;
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

  /* ══════════════════════════════════════════════════════════════════════════
     02. LIVE MONITOR PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderLiveMonitorPage(state, currentStage) {
    const container = document.getElementById('page-live-monitor');
    if (!container) return;

    const isFlood = state.floodMode;
    const activeRoute = (state.selectedRoute || 'reuse').toUpperCase();

    // Fill inner HTML if container only has default placeholder
    if (!document.getElementById('monitor-gauges-grid')) {
      container.innerHTML = `
        <!-- Live Stream Hero Card -->
        <div class="schematic-panel">
          <div class="schematic-header">
            <div class="schematic-title-group">
              <h3>LIVE SCADA TELEMETRY MONITOR</h3>
              <p>Real-time telemetry stream & automated FloodShield bypass status</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="header-chip chip-online">● LIVE DATA STREAM</span>
              <span class="demo-tag">DEMO TELEMETRY</span>
            </div>
          </div>

          <!-- Live Telemetry KPI Gauges -->
          <div class="monitor-kpi-grid" id="monitor-gauges-grid"></div>
        </div>

        <!-- Real-time Charts Stream -->
        <div class="charts-grid">
          <div class="chart-panel">
            <div class="chart-header">
              <h4>DISCHARGE FLOW RATE STREAM</h4>
              <span class="demo-tag">LITERS / MIN</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-monitor-flow-canvas"></canvas>
            </div>
          </div>

          <div class="chart-panel">
            <div class="chart-header">
              <h4>STORAGE LEVEL & SOIL MOISTURE STREAM</h4>
              <span class="demo-tag">% SATURATION</span>
            </div>
            <div class="chart-canvas-wrap">
              <canvas id="chart-monitor-level-canvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Quick Operator Actions & Live Feed -->
        <div class="dash-two-col">
          <div class="events-panel">
            <div class="card-header-clean">
              <h4>LIVE TELEMETRY EVENT STREAM</h4>
              <span class="kpi-status-tag ok">CONTINUOUS BUFFER</span>
            </div>
            <table class="events-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>STAGE</th>
                  <th>FLOW</th>
                  <th>LEVEL</th>
                  <th>MOISTURE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody id="monitor-stream-tbody"></tbody>
            </table>
          </div>

          <!-- Quick Action Controls -->
          <div class="quality-panel">
            <div class="card-header-clean">
              <h4>QUICK SCADA SIMULATION OVERRIDE</h4>
              <span class="m3-badge-interactive">OPERATOR INTERFACE</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:6px;">
              <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-card-subtle); padding:8px 12px; border-radius:var(--radius-sm);">
                <span style="font-weight:600; font-size:12px;">STAGE STEPPER:</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn-action" onclick="window.SimulationService && window.SimulationService.prevStage()">⏮ PREV</button>
                  <button class="btn-action btn-primary" onclick="window.SimulationService && window.SimulationService.nextStage()">NEXT ⏭</button>
                </div>
              </div>

              <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-card-subtle); padding:8px 12px; border-radius:var(--radius-sm);">
                <span style="font-weight:600; font-size:12px;">SYSTEM CONDITION:</span>
                <div class="btn-toggle-group">
                  <button class="btn-toggle ${!isFlood ? 'active-normal' : ''}" onclick="window.SimulationService && window.SimulationService.setFloodCondition(false)">✓ NORMAL</button>
                  <button class="btn-toggle ${isFlood ? 'active-flood' : ''}" onclick="window.SimulationService && window.SimulationService.setFloodCondition(true)">⚠ FLOOD</button>
                </div>
              </div>

              <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-card-subtle); padding:8px 12px; border-radius:var(--radius-sm);">
                <span style="font-weight:600; font-size:12px;">M3 ROUTE:</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn-action ${state.selectedRoute === 'reuse' ? 'btn-primary' : ''}" onclick="window.SimulationService && window.SimulationService.setManualRoute('reuse')">REUSE</button>
                  <button class="btn-action ${state.selectedRoute === 'recharge' ? 'btn-primary' : ''}" ${isFlood ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="window.SimulationService && window.SimulationService.setManualRoute('recharge')">RECHARGE</button>
                  <button class="btn-action ${state.selectedRoute === 'bypass' ? 'btn-warn' : ''}" onclick="window.SimulationService && window.SimulationService.setManualRoute('bypass')">BYPASS</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Populate gauges grid
    const gaugesGrid = document.getElementById('monitor-gauges-grid');
    if (gaugesGrid) {
      gaugesGrid.innerHTML = `
        <div class="monitor-kpi-card">
          <span class="m-kpi-title">CURRENT STAGE</span>
          <span class="m-kpi-val" style="color:var(--blue-secondary); font-size:15px;">${currentStage.code} ${currentStage.shortName}</span>
          <span class="m-kpi-sub">${currentStage.statusText}</span>
        </div>

        <div class="monitor-kpi-card">
          <span class="m-kpi-title">WATER TANK LEVEL</span>
          <span class="m-kpi-val">${typeof state.sensors.waterLevel === 'number' ? state.sensors.waterLevel.toFixed(1) : state.sensors.waterLevel}%</span>
          <div class="mini-progress-bar"><div class="mini-fill" style="width:${state.sensors.waterLevel}%; background:#0284C7;"></div></div>
        </div>

        <div class="monitor-kpi-card">
          <span class="m-kpi-title">DISCHARGE FLOW RATE</span>
          <span class="m-kpi-val">${typeof state.sensors.flowRate === 'number' ? state.sensors.flowRate.toFixed(1) : state.sensors.flowRate} <span style="font-size:11px;">L/min</span></span>
          <span class="m-kpi-sub" style="color:var(--status-green);">Nominal Discharge</span>
        </div>

        <div class="monitor-kpi-card">
          <span class="m-kpi-title">SOIL MOISTURE</span>
          <span class="m-kpi-val" style="color:${isFlood ? 'var(--status-red)' : 'var(--status-green)'};">${typeof state.sensors.soilMoisture === 'number' ? state.sensors.soilMoisture.toFixed(1) : state.sensors.soilMoisture}%</span>
          <span class="m-kpi-sub">${isFlood ? '⚠ SATURATED (>85%)' : '✓ SUITABLE (<85%)'}</span>
        </div>

        <div class="monitor-kpi-card">
          <span class="m-kpi-title">M3 ROUTE SELECTION</span>
          <span class="m-kpi-val" style="color:${state.selectedRoute === 'bypass' ? 'var(--status-red)' : (state.selectedRoute === 'recharge' ? 'var(--status-green)' : 'var(--blue-secondary)')}; font-size:14px;">${activeRoute}</span>
          <span class="m-kpi-sub">${isFlood ? 'Safety Override Active' : 'Operator Selected'}</span>
        </div>

        <div class="monitor-kpi-card">
          <span class="m-kpi-title">RECHARGE VALVE</span>
          <span class="m-kpi-val" style="color:${isFlood ? 'var(--status-red)' : 'var(--status-green)'};">${isFlood ? '0% (CLOSED)' : (state.selectedRoute === 'recharge' ? '100% (OPEN)' : '0% (STANDBY)')}</span>
          <span class="m-kpi-sub">${isFlood ? 'Recharge Prohibited' : 'Aquifer Infiltration'}</span>
        </div>

        <div class="monitor-kpi-card">
          <span class="m-kpi-title">BYPASS VALVE GATE</span>
          <span class="m-kpi-val" style="color:${isFlood || state.selectedRoute === 'bypass' ? 'var(--status-red)' : 'var(--text-secondary)'};">${isFlood || state.selectedRoute === 'bypass' ? '100% (OPEN)' : '0% (STANDBY)'}</span>
          <span class="m-kpi-sub">${isFlood || state.selectedRoute === 'bypass' ? 'Active Diversion' : 'Standby Mode'}</span>
        </div>

        <div class="monitor-kpi-card">
          <span class="m-kpi-title">SYSTEM HEALTH</span>
          <span class="m-kpi-val" style="color:var(--status-green);">${state.systemHealth}%</span>
          <span class="m-kpi-sub">All nodes reporting</span>
        </div>
      `;
    }

    // Populate stream table
    const streamTbody = document.getElementById('monitor-stream-tbody');
    if (streamTbody) {
      const logs = (state.historyLogs || []).slice(0, 6);
      streamTbody.innerHTML = logs.map(l => `
        <tr>
          <td style="font-family:var(--font-mono); color:var(--text-secondary);">${l.time}</td>
          <td style="font-weight:700; color:var(--navy-primary);">${l.stage}</td>
          <td style="font-family:var(--font-mono); color:var(--blue-secondary); font-weight:700;">${l.flow}</td>
          <td style="font-family:var(--font-mono);">${l.level}</td>
          <td style="font-family:var(--font-mono); color:${l.flood === 'SATURATED' ? 'var(--status-red)' : 'var(--navy-primary)'};">${l.moisture}</td>
          <td><span class="kpi-status-tag ${l.flood === 'SATURATED' ? 'crit' : 'ok'}">${l.flood}</span></td>
        </tr>
      `).join('');
    }

    // Draw Live Monitor canvas charts if active view
    if (activeView === 'live-monitor') {
      ChartManager.drawFlowChart('chart-monitor-flow-canvas', state.history);
      ChartManager.drawMoistureChart('chart-monitor-level-canvas', state.history);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     03. SYSTEM FLOW PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSystemFlowPage(state, currentStage) {
    const container = document.getElementById('page-system-flow');
    if (!container) return;

    if (activeView === 'system-flow') {
      SchematicRenderer.renderSchematic('svg-flow-expanded-container', state);
    }

    // Populate 6-stage physical process detailed cards
    let stageCardsWrap = document.getElementById('flow-stages-cards-grid');
    if (!stageCardsWrap) {
      const parentSchematic = container.querySelector('.schematic-panel');
      if (parentSchematic) {
        const wrapDiv = document.createElement('div');
        wrapDiv.id = 'flow-stages-cards-grid';
        wrapDiv.className = 'flow-stages-grid';
        parentSchematic.appendChild(wrapDiv);
        stageCardsWrap = wrapDiv;
      }
    }

    if (stageCardsWrap) {
      stageCardsWrap.innerHTML = SystemState.STAGES.map((s, idx) => {
        const isCurr = idx === state.currentStageIndex;
        const isDone = idx < state.currentStageIndex;
        return `
          <div class="flow-stage-detail-card ${isCurr ? 'active-flow-card' : ''}" onclick="window.SimulationService && window.SimulationService.setStageIndex(${idx})">
            <div class="flow-stage-head">
              <span class="flow-stage-num">${s.code}</span>
              <span class="flow-stage-title">${s.name}</span>
              <span class="flow-stage-tag ${isDone ? 'done' : (isCurr ? 'active' : '')}">
                ${isDone ? '✓ COMPLETED' : (isCurr ? '● ACTIVE' : '○ UPCOMING')}
              </span>
            </div>
            <p class="flow-stage-body">${s.desc}</p>
            <div class="flow-stage-io">
              <div><strong style="color:var(--text-muted);">IN:</strong> ${s.input}</div>
              <div><strong style="color:var(--blue-secondary);">OUT:</strong> ${s.output}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     04. SENSORS PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSensorsPage(state) {
    const container = document.getElementById('page-sensors');
    if (!container) return;

    const filter = (state.filters && state.filters.sensorStatus) ? state.filters.sensorStatus : 'ALL';
    const allSensors = SensorService.getSensorRegistry(state);

    const filteredSensors = allSensors.filter(s => {
      if (filter === 'ALL') return true;
      if (filter === 'ONLINE') return s.statusType === 'online';
      if (filter === 'WARNING') return s.statusType === 'warning';
      if (filter === 'CRITICAL') return s.statusType === 'critical';
      return true;
    });

    // Check if filter bar exists
    if (!document.getElementById('sensors-filter-bar')) {
      const panel = container.querySelector('.events-panel');
      if (panel) {
        panel.innerHTML = `
          <div class="card-header-clean">
            <div>
              <h3>SENSOR HARDWARE REGISTER & DIAGNOSTIC TABLE</h3>
              <p style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">Complete register of field telemetry sensors and actuator valves</p>
            </div>
            <span class="demo-tag">SIMULATED TELEMETRY</span>
          </div>

          <!-- Sensor Filter Toolbar -->
          <div class="table-filter-toolbar" id="sensors-filter-bar">
            <div class="filter-btn-group">
              <button class="btn-filter ${filter === 'ALL' ? 'active' : ''}" onclick="window.Dashboard.setSensorFilter('ALL')">ALL SENSORS (${allSensors.length})</button>
              <button class="btn-filter ${filter === 'ONLINE' ? 'active' : ''}" onclick="window.Dashboard.setSensorFilter('ONLINE')">ONLINE</button>
              <button class="btn-filter ${filter === 'WARNING' ? 'active' : ''}" onclick="window.Dashboard.setSensorFilter('WARNING')">WARNING</button>
              <button class="btn-filter ${filter === 'CRITICAL' ? 'active' : ''}" onclick="window.Dashboard.setSensorFilter('CRITICAL')">CRITICAL</button>
            </div>
          </div>

          <!-- Table -->
          <div style="overflow-x:auto;">
            <table class="events-table">
              <thead>
                <tr>
                  <th>TAG</th>
                  <th>SENSOR HARDWARE NAME</th>
                  <th>LOCATION</th>
                  <th>CURRENT VALUE</th>
                  <th>STATUS</th>
                  <th>ACCURACY</th>
                  <th>INTERFACE / BUS</th>
                  <th>CONNECTION</th>
                </tr>
              </thead>
              <tbody id="sensor-table-body"></tbody>
            </table>
          </div>
        `;
      }
    }

    const tbody = document.getElementById('sensor-table-body');
    if (tbody) {
      tbody.innerHTML = filteredSensors.map(r => `
        <tr>
          <td style="font-family:var(--font-mono); font-weight:700; color:var(--text-secondary);">${r.tag}</td>
          <td style="font-weight:700; color:var(--navy-primary);">${r.name}</td>
          <td style="color:var(--text-secondary);">${r.location}</td>
          <td style="color:var(--blue-secondary); font-family:var(--font-mono); font-weight:700; font-size:13px;">${r.value} ${r.unit}</td>
          <td><span class="sev-tag ${r.statusType === 'critical' ? 'critical' : (r.statusType === 'warning' ? 'warning' : 'info')}">${r.status}</span></td>
          <td style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">${r.accuracy}</td>
          <td style="font-size:11px; color:var(--navy-primary); font-family:var(--font-mono);">${r.bus}</td>
          <td><span class="kpi-status-tag ok">${r.connection}</span></td>
        </tr>
      `).join('');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     05. WATER QUALITY PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderWaterQualityPage(state) {
    const container = document.getElementById('page-water-quality');
    if (!container) return;

    if (!document.getElementById('wq-stages-comparison-grid')) {
      container.innerHTML = `
        <div class="quality-panel">
          <div class="card-header-clean">
            <div>
              <h3>WATER QUALITY MONITORING & DISCHARGE STANDARDS</h3>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Effluent parameters monitored against Indian Non-Potable Reuse Norms (IS 10500 / CPCB).</p>
            </div>
            <span class="demo-tag">DEMO TELEMETRY</span>
          </div>

          <!-- 3-Stage Treatment Effluent Progression Matrix -->
          <div style="margin-top:10px;">
            <h4 style="font-size:12px; font-weight:700; color:var(--navy-primary); text-transform:uppercase; margin-bottom:8px;">
              3-STAGE TREATMENT EFFLUENT PROGRESSION (PRE-TREATMENT → BIOFILTER → FINAL EFFLUENT)
            </h4>
            <div class="wq-comparison-table-wrap">
              <table class="events-table">
                <thead>
                  <tr>
                    <th>PARAMETER</th>
                    <th>PRE-TREATMENT INFLOW</th>
                    <th>BIOFILTER OUTPUT</th>
                    <th>FINAL REUSABLE EFFLUENT</th>
                    <th>BENCHMARK STANDARD (IS 10500)</th>
                    <th>COMPLIANCE STATUS</th>
                  </tr>
                </thead>
                <tbody id="wq-comparison-tbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Parameter Telemetry Cards Grid -->
          <div style="margin-top:14px;">
            <h4 style="font-size:12px; font-weight:700; color:var(--navy-primary); text-transform:uppercase; margin-bottom:8px;">
              CURRENT EFFLUENT PARAMETERS (LAB & SENSOR TELEMETRY)
            </h4>
            <div class="quality-grid" id="wq-detailed-grid"></div>
          </div>

          <!-- Regulatory Standards Reference Summary -->
          <div style="background:var(--bg-card-subtle); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-top:12px; font-size:11.5px; color:var(--text-secondary); line-height:1.5;">
            <strong style="color:var(--navy-primary);">CPCB / IS 10500 Reuse Criteria:</strong> Treated greywater meeting BOD &lt; 10 mg/L and Turbidity &lt; 5 NTU is certified safe for household non-potable flushing and landscape irrigation, significantly reducing fresh water demand.
          </div>
        </div>
      `;
    }

    // Populate comparison table
    const compTbody = document.getElementById('wq-comparison-tbody');
    if (compTbody && state.waterQuality && state.waterQuality.stages) {
      compTbody.innerHTML = state.waterQuality.stages.map(st => `
        <tr>
          <td style="font-weight:700; color:var(--navy-primary);">${st.parameter}</td>
          <td style="font-family:var(--font-mono); color:var(--text-secondary);">${st.pre} ${st.unit}</td>
          <td style="font-family:var(--font-mono); color:var(--teal-treatment); font-weight:600;">${st.biofilter} ${st.unit}</td>
          <td style="font-family:var(--font-mono); color:var(--blue-secondary); font-weight:700; font-size:13px;">${st.effluent} ${st.unit}</td>
          <td style="font-family:var(--font-mono); color:var(--text-muted); font-size:11px;">${st.benchmark}</td>
          <td><span class="kpi-status-tag ok">${st.status}</span></td>
        </tr>
      `).join('');
    }

    // Populate parameter grid
    const detailedGrid = document.getElementById('wq-detailed-grid');
    if (detailedGrid && state.waterQuality && state.waterQuality.stages) {
      detailedGrid.innerHTML = state.waterQuality.stages.map(st => `
        <div class="param-card">
          <div class="param-name">
            <span>${st.parameter}</span>
            <span class="kpi-status-tag ok" style="font-size:8.5px;">NOMINAL</span>
          </div>
          <div style="font-size:18px; font-weight:700; color:var(--navy-primary); font-family:var(--font-mono); margin-top:4px;">
            ${st.effluent} <span style="font-size:11px; color:var(--text-secondary);">${st.unit}</span>
          </div>
          <div style="font-size:9.5px; color:var(--text-muted); font-family:var(--font-mono); margin-top:2px;">
            Standard: ${st.benchmark}
          </div>
        </div>
      `).join('');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     06. FLOODSHIELD PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderFloodShieldPage(state) {
    const container = document.getElementById('page-floodshield');
    if (!container) return;

    const isFlood = state.floodMode;

    if (!document.getElementById('floodshield-decision-view')) {
      container.innerHTML = `
        <div class="schematic-panel">
          <div class="schematic-header">
            <div class="schematic-title-group">
              <h3>FLOODSHIELD AUTOMATED BYPASS MECHANISM</h3>
              <p>Hydraulic overflow prevention, soil saturation sensing, and soak-pit failure protection</p>
            </div>
            <span class="demo-tag">ACTIVE SAFETY ENGINE</span>
          </div>

          <!-- Hero State Banner -->
          <div id="fs-hero-banner"></div>

          <!-- Diagnostic Metrics & Decision Flow -->
          <div class="dash-two-col" id="floodshield-decision-view" style="margin-top:8px;">
            <!-- Left: Conventional vs FlowShield -->
            <div style="background:#FFFFFF; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; font-size:12px; line-height:1.6;">
              <h4 style="color:var(--navy-primary); font-size:13px; font-weight:700;">The Conventional Soak-Pit Overflow Problem</h4>
              <p style="color:var(--text-secondary); margin-top:4px;">
                Conventional rural soak pits rely strictly on continuous soil percolation. During monsoon rains, ground saturation halts absorption. Pits back up and overflow into village lanes, breeding disease vectors and contaminating groundwater.
              </p>
              
              <h4 style="color:var(--blue-secondary); font-size:13px; font-weight:700; margin-top:12px;">The FLOWSHIELD Automated Innovation</h4>
              <p style="color:var(--text-secondary); margin-top:4px;">
                FLOWSHIELD embeds a capacitive soil moisture sensor at the aquifer infiltration bed. When saturation crosses 85%, the controller automatically shuts the recharge valve and diverts treated effluent through a raised overflow channel into municipal stormwater drainage.
              </p>
            </div>

            <!-- Right: Decision Logic Matrix -->
            <div style="background:var(--bg-card-subtle); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px;">
              <h4 style="color:var(--navy-primary); font-size:13px; font-weight:700;">AUTOMATED SAFETY DECISION LOGIC</h4>
              
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px; font-size:11.5px;">
                <div style="background:#FFFFFF; padding:10px; border-radius:var(--radius-sm); border-left:4px solid var(--status-green);">
                  <strong style="color:var(--status-green);">NORMAL GROUND CONDITION (&lt; 85% Saturation)</strong>
                  <p style="color:var(--text-secondary); margin-top:2px;">Recharge Valve: OPEN (100%) · Bypass Gate: STANDBY · Aquifer replenishment active.</p>
                </div>

                <div style="background:#FFFFFF; padding:10px; border-radius:var(--radius-sm); border-left:4px solid var(--status-red);">
                  <strong style="color:var(--status-red);">FLOOD / SATURATED CONDITION (&gt; 85% Saturation)</strong>
                  <p style="color:var(--text-secondary); margin-top:2px;">Recharge Valve: CLOSED (0%) · Bypass Gate: ACTIVE (100%) · Overflow safely diverted.</p>
                </div>
              </div>

              <!-- Interactive Simulator Trigger -->
              <div style="margin-top:12px; display:flex; align-items:center; justify-content:space-between; background:#FFFFFF; padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                <span style="font-weight:700; font-size:11.5px; color:var(--navy-primary);">TEST SAFETY LOGIC:</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn-action ${!isFlood ? 'btn-primary' : ''}" onclick="window.SimulationService && window.SimulationService.setFloodCondition(false)">NORMAL (38%)</button>
                  <button class="btn-action ${isFlood ? 'btn-warn' : ''}" onclick="window.SimulationService && window.SimulationService.setFloodCondition(true)">TRIGGER FLOOD (94%)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const heroBanner = document.getElementById('fs-hero-banner');
    if (heroBanner) {
      if (isFlood) {
        heroBanner.innerHTML = `
          <div style="background:#FEE2E2; border:1px solid #FCA5A5; border-radius:var(--radius-md); padding:14px; display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:24px;">⚠</span>
              <div>
                <h4 style="color:#DC2626; font-size:14px; font-weight:800;">FLOOD SIMULATION ACTIVE — GROUND SATURATED (94%)</h4>
                <p style="color:#7F1D1D; font-size:12px; margin-top:2px;">Recharge blocked by safety logic · FloodShield bypass actively diverting treated effluent.</p>
              </div>
            </div>
            <span class="sev-tag critical" style="font-size:11px; padding:4px 8px;">RECHARGE BLOCKED</span>
          </div>
        `;
      } else {
        heroBanner.innerHTML = `
          <div style="background:#F0FDF4; border:1px solid #86EFAC; border-radius:var(--radius-md); padding:14px; display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:24px;">✓</span>
              <div>
                <h4 style="color:#16A34A; font-size:14px; font-weight:800;">GROUND CONDITIONS SUITABLE (38% MOISTURE)</h4>
                <p style="color:#14532D; font-size:12px; margin-top:2px;">Aquifer infiltration bed is clear and accepting controlled groundwater recharge.</p>
              </div>
            </div>
            <span class="sev-tag info" style="font-size:11px; padding:4px 8px; background:#DCFCE7; color:#16A34A;">RECHARGE ENABLED</span>
          </div>
        `;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     07. ALERTS PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderAlertsPage(state) {
    const container = document.getElementById('page-alerts');
    if (!container) return;

    const filter = (state.filters && state.filters.alertSeverity) ? state.filters.alertSeverity : 'ALL';
    const allAlerts = AlertService.getAlerts('ALL');
    const filteredAlerts = AlertService.getAlerts(filter);

    const critCount = allAlerts.filter(a => a.severity === 'critical').length;
    const warnCount = allAlerts.filter(a => a.severity === 'warning').length;
    const infoCount = allAlerts.filter(a => a.severity === 'info').length;

    // Build entire page view
    container.innerHTML = `
      <div class="events-panel">
        <div class="card-header-clean">
          <div>
            <h3>SCADA ALERT CENTER & OPERATIONAL EVENT HISTORY</h3>
            <p style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">Full chronological log of operational notifications, threshold alarms, and safety overrides</p>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-action" onclick="window.Dashboard.generateTestAlert()" style="font-size:11px; padding:3px 8px;">+ TEST ALERT</button>
            <button class="btn-action btn-warn" id="btn-clear-alerts-page" onclick="window.Dashboard.clearAllAlerts()" style="font-size:11px; padding:3px 8px;">CLEAR ALERTS</button>
          </div>
        </div>

        <!-- Alert Stats Row -->
        <div class="alert-stats-strip">
          <div class="alert-stat-box">
            <span class="a-stat-lbl">TOTAL LOGGED</span>
            <span class="a-stat-val">${allAlerts.length}</span>
          </div>
          <div class="alert-stat-box" style="border-left-color:var(--status-red);">
            <span class="a-stat-lbl" style="color:var(--status-red);">CRITICAL ALARMS</span>
            <span class="a-stat-val" style="color:var(--status-red);">${critCount}</span>
          </div>
          <div class="alert-stat-box" style="border-left-color:var(--status-amber);">
            <span class="a-stat-lbl" style="color:var(--status-amber);">WARNINGS</span>
            <span class="a-stat-val" style="color:var(--status-amber);">${warnCount}</span>
          </div>
          <div class="alert-stat-box" style="border-left-color:var(--blue-secondary);">
            <span class="a-stat-lbl" style="color:var(--blue-secondary);">INFORMATIONAL</span>
            <span class="a-stat-val" style="color:var(--blue-secondary);">${infoCount}</span>
          </div>
        </div>

        <!-- Filter Buttons -->
        <div class="table-filter-toolbar">
          <div class="filter-btn-group">
            <button class="btn-filter ${filter === 'ALL' ? 'active' : ''}" onclick="window.Dashboard.setAlertFilter('ALL')">ALL (${allAlerts.length})</button>
            <button class="btn-filter ${filter === 'CRITICAL' ? 'active' : ''}" onclick="window.Dashboard.setAlertFilter('CRITICAL')">CRITICAL (${critCount})</button>
            <button class="btn-filter ${filter === 'WARNING' ? 'active' : ''}" onclick="window.Dashboard.setAlertFilter('WARNING')">WARNING (${warnCount})</button>
            <button class="btn-filter ${filter === 'INFO' ? 'active' : ''}" onclick="window.Dashboard.setAlertFilter('INFO')">INFO (${infoCount})</button>
          </div>
        </div>

        <!-- Table -->
        <div style="overflow-x:auto;">
          <table class="events-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>SEVERITY</th>
                <th>EVENT TITLE</th>
                <th>MESSAGE / REASON</th>
                <th>RELATED STAGE</th>
                <th>ROUTE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAlerts.length === 0 ? `
                <tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">No alerts match the selected filter.</td></tr>
              ` : filteredAlerts.map(al => `
                <tr>
                  <td style="color:var(--text-secondary); font-family:var(--font-mono); font-weight:600;">${al.time}</td>
                  <td><span class="sev-tag ${al.severity}">${al.severity.toUpperCase()}</span></td>
                  <td style="font-weight:700; color:var(--navy-primary);">${al.title}</td>
                  <td style="color:var(--text-secondary); max-width:320px;">${al.msg}</td>
                  <td style="font-size:11px; font-weight:600; color:var(--navy-primary);">${al.stage || 'SYSTEM'}</td>
                  <td style="font-family:var(--font-mono); font-weight:700; color:var(--blue-secondary);">${al.route || 'REUSE'}</td>
                  <td><span class="kpi-status-tag ${al.severity === 'critical' ? 'crit' : 'ok'}">${al.status || 'ACTIVE'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     08. HISTORY PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderHistoryPage(state) {
    const container = document.getElementById('page-history');
    if (!container) return;

    const filterRoute = (state.filters && state.filters.historyRoute) ? state.filters.historyRoute : 'ALL';
    const logs = state.historyLogs || [];

    const filteredLogs = logs.filter(l => {
      if (filterRoute === 'ALL') return true;
      return l.route === filterRoute;
    });

    container.innerHTML = `
      <div class="events-panel">
        <div class="card-header-clean">
          <div>
            <h3>HISTORICAL SCADA MONITORING & TELEMETRY LOG</h3>
            <p style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">Continuous session log of hydraulic stages, sensor snapshots, and routing dispatch events</p>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-action" onclick="window.Dashboard.exportHistoryCSV()" style="font-size:11px; padding:3px 8px;">📥 EXPORT CSV</button>
            <button class="btn-action" onclick="window.SystemState && window.SystemState.notify()" style="font-size:11px; padding:3px 8px;">↻ REFRESH</button>
          </div>
        </div>

        <!-- Filter Toolbar -->
        <div class="table-filter-toolbar">
          <div class="filter-btn-group">
            <button class="btn-filter ${filterRoute === 'ALL' ? 'active' : ''}" onclick="window.Dashboard.setHistoryRouteFilter('ALL')">ALL ROUTES (${logs.length})</button>
            <button class="btn-filter ${filterRoute === 'REUSE' ? 'active' : ''}" onclick="window.Dashboard.setHistoryRouteFilter('REUSE')">REUSE</button>
            <button class="btn-filter ${filterRoute === 'RECHARGE' ? 'active' : ''}" onclick="window.Dashboard.setHistoryRouteFilter('RECHARGE')">RECHARGE</button>
            <button class="btn-filter ${filterRoute === 'BYPASS' ? 'active' : ''}" onclick="window.Dashboard.setHistoryRouteFilter('BYPASS')">BYPASS</button>
          </div>
        </div>

        <!-- History Table -->
        <div style="overflow-x:auto;">
          <table class="events-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>EVENT TYPE</th>
                <th>SYSTEM STAGE</th>
                <th>FLOW RATE</th>
                <th>WATER LEVEL</th>
                <th>SOIL MOISTURE</th>
                <th>FLOOD STATE</th>
                <th>RECHARGE</th>
                <th>HEALTH</th>
                <th>ROUTE</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.length === 0 ? `
                <tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:20px;">No historical records found for this filter.</td></tr>
              ` : filteredLogs.map(row => `
                <tr>
                  <td style="font-family:var(--font-mono); color:var(--text-secondary); font-weight:600;">${row.time}</td>
                  <td style="font-weight:700; color:var(--navy-primary);">${row.event}</td>
                  <td>${row.stage}</td>
                  <td style="font-family:var(--font-mono); font-weight:700; color:var(--blue-secondary);">${row.flow}</td>
                  <td style="font-family:var(--font-mono);">${row.level}</td>
                  <td style="font-family:var(--font-mono); color:${row.flood === 'SATURATED' ? 'var(--status-red)' : 'var(--navy-primary)'};">${row.moisture}</td>
                  <td><span class="kpi-status-tag ${row.flood === 'SATURATED' ? 'crit' : 'ok'}">${row.flood}</span></td>
                  <td><span class="kpi-status-tag ${row.recharge === 'BLOCKED' ? 'crit' : 'ok'}">${row.recharge}</span></td>
                  <td style="font-family:var(--font-mono);">${row.health}</td>
                  <td style="font-family:var(--font-mono); font-weight:700; color:var(--blue-secondary);">${row.route}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     09. SYSTEM INFO PAGE RENDERER
     ══════════════════════════════════════════════════════════════════════════ */
  function renderSystemInfoPage(state) {
    const container = document.getElementById('page-system-info');
    if (!container) return;

    container.innerHTML = `
      <div class="schematic-panel">
        <div class="schematic-header">
          <div class="schematic-title-group">
            <h3>SYSTEM SPECIFICATIONS & TECHNICAL ARCHITECTURE</h3>
            <p>Smart India Hackathon Problem Statement SIH26257 — Engineering Documentation</p>
          </div>
          <span class="demo-tag">SIH26257 · v2.4.0</span>
        </div>

        <!-- Specifications Grid -->
        <div class="dash-two-col" style="margin-top:8px;">
          <!-- Project Identity -->
          <div style="background:#FFFFFF; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; font-size:12px; line-height:1.6;">
            <h4 style="color:var(--navy-primary); font-weight:800; font-size:13.5px;">PROJECT SPECIFICATION</h4>
            <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px;">
              <div><strong>PROJECT:</strong> FLOWSHIELD–GREYLOOP</div>
              <div><strong>SIH PROBLEM STATEMENT:</strong> SIH26257 (Rural Greywater Management)</div>
              <div><strong>SYSTEM IDENTIFIER:</strong> FGL-SIH26257-001</div>
              <div><strong>OPERATIONAL MODE:</strong> DEMONSTRATION & SCADA TELEMETRY</div>
              <div><strong>FIRMWARE / UI VERSION:</strong> v2.4.0</div>
            </div>

            <h4 style="color:var(--navy-primary); font-weight:800; font-size:13.5px; margin-top:12px;">SYSTEM ARCHITECTURE</h4>
            <p style="color:var(--text-secondary); margin-top:4px;">
              Decoupled environmental telemetry engine supporting local demonstration fallback and native Supabase PostgreSQL cloud persistence. Ready for ESP32 MQTT hardware bridge connection.
            </p>
          </div>

          <!-- Biomass Media Breakdown -->
          <div style="background:var(--bg-card-subtle); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; font-size:12px; line-height:1.6;">
            <h4 style="color:var(--navy-primary); font-weight:800; font-size:13.5px;">CORE BIOMASS FILTRATION MEDIA</h4>
            <div style="margin-top:6px; display:flex; flex-direction:column; gap:6px;">
              <div><strong>1. Biochar (Pyrolyzed Biomass):</strong> High specific surface area for microporous surfactant and micro-pollutant adsorption.</div>
              <div><strong>2. Coco Coir & Sugarcane Bagasse:</strong> Fibrous organic matrices providing optimal biofilm attachment area for aerobic microbial digestion.</div>
              <div><strong>3. Rice Husk & Silica Matrix:</strong> Natural agricultural byproduct layer trapping fine suspended particulates and turbidity.</div>
              <div><strong>4. Graded River Sand & Gravel:</strong> Mechanical depth polishing and hydraulic base drainage.</div>
              <div><strong>5. Phytoremediation Plants (Vetiver/Canna):</strong> Root zone nutrient uptake (Nitrogen and Phosphorus removal).</div>
            </div>
          </div>
        </div>

        <!-- Soak Pit Resilience & M3 Routing Explanation -->
        <div style="background:#FFFFFF; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; font-size:12px; line-height:1.6; margin-top:10px;">
          <h4 style="color:var(--blue-secondary); font-weight:800; font-size:13px;">M3 3-WAY TREATED WATER DISPATCH STRATEGY</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:8px;">
            <div style="background:var(--bg-card-subtle); padding:10px; border-radius:var(--radius-sm);">
              <strong style="color:var(--blue-secondary);">1. DIRECT REUSE</strong>
              <p style="color:var(--text-secondary); margin-top:2px;">Dispatched to dual-plumbed toilet cisterns and landscape irrigation to conserve freshwater.</p>
            </div>
            <div style="background:var(--bg-card-subtle); padding:10px; border-radius:var(--radius-sm);">
              <strong style="color:var(--status-green);">2. CONTROLLED RECHARGE</strong>
              <p style="color:var(--text-secondary); margin-top:2px;">Discharged to sub-surface infiltration bed when soil moisture &lt; 85% to replenish the aquifer.</p>
            </div>
            <div style="background:var(--bg-card-subtle); padding:10px; border-radius:var(--radius-sm);">
              <strong style="color:var(--status-red);">3. FLOODSHIELD BYPASS</strong>
              <p style="color:var(--text-secondary); margin-top:2px;">Automated raised diversion active during saturation (>85%) to prevent soak pit failure and backflow.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HELPERS & UI ACTIONS
     ══════════════════════════════════════════════════════════════════════════ */
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

  function setAlertFilter(severity) {
    const state = SystemState.getState();
    if (!state.filters) state.filters = {};
    state.filters.alertSeverity = severity;
    renderAlertsPage(state);
  }

  function setSensorFilter(status) {
    const state = SystemState.getState();
    if (!state.filters) state.filters = {};
    state.filters.sensorStatus = status;
    renderSensorsPage(state);
  }

  function setHistoryRouteFilter(route) {
    const state = SystemState.getState();
    if (!state.filters) state.filters = {};
    state.filters.historyRoute = route;
    renderHistoryPage(state);
  }

  function clearAllAlerts() {
    AlertService.clearAlerts();
    const state = SystemState.getState();
    SimulationService.showToast('All system alerts cleared from active log.', 'ok');
    SystemState.notify();
  }

  function generateTestAlert() {
    const types = ['critical', 'warning', 'info'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const titles = {
      critical: 'High Sump Level Warning',
      warning: 'Turbidity Sensor Calibration Due',
      info: 'Routine Filter Backwash Recommended'
    };
    const msgs = {
      critical: 'Inlet sump level reached 92%. Inspect household discharge rate.',
      warning: 'Optical turbidity sensor optical path attenuation check recommended.',
      info: 'Scheduled periodic backwash recommended for optimal biofilm aeration.'
    };

    AlertService.addAlert(chosenType, titles[chosenType], msgs[chosenType]);
    SimulationService.showToast(`Test alert generated: [${chosenType.toUpperCase()}] ${titles[chosenType]}`, 'ok');
    SystemState.notify();
  }

  function exportHistoryCSV() {
    const state = SystemState.getState();
    const logs = state.historyLogs || [];
    if (logs.length === 0) {
      SimulationService.showToast('No history logs to export.', 'warn');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Time,Event,Stage,FlowRate,WaterLevel,SoilMoisture,FloodState,RechargeState,Health,Route\n';

    logs.forEach(l => {
      csvContent += `"${l.time}","${l.event}","${l.stage}","${l.flow}","${l.level}","${l.moisture}","${l.flood}","${l.recharge}","${l.health}","${l.route}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FLOWSHIELD_SCADA_LOG_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    SimulationService.showToast('SCADA Historical log exported to CSV successfully.', 'ok');
  }

  window.Dashboard = {
    setActiveView,
    getActiveView,
    render,
    setAlertFilter,
    setSensorFilter,
    setHistoryRouteFilter,
    clearAllAlerts,
    generateTestAlert,
    exportHistoryCSV
  };

})(window, document);
