/**
 * FLOWSHIELD–GREYLOOP | Before-and-After Water Quality Comparison Module
 * Renders the Water Quality Monitoring page with before/after comparison panels,
 * bar charts, change indicators, and a summary strip.
 *
 * DATA MODE: DEMO DATA — NOT LIVE SENSOR READINGS.
 * All values are illustrative examples for prototype demonstration only.
 * Replace DEMO_DATA below with actual sensor readings when hardware is connected.
 */

(function (window) {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     DEMO DATA — ILLUSTRATIVE SAMPLE VALUES (NOT MEASURED RESULTS)
     Label: "DEMO DATA — NOT LIVE SENSOR READINGS"
     Replace with real sensor data to enable live mode.
     ══════════════════════════════════════════════════════════════════════════ */
  const DEMO_DATA = {
    isDemo: true, // set false when connected to real sensors
    timestamp: null, // set by module at runtime

    before: {
      ph:           { value: 7.8,  unit: '',       name: 'pH Level',                  maxScale: 14 },
      turbidity:    { value: 45.0, unit: 'NTU',    name: 'Turbidity',                  maxScale: 100 },
      tds:          { value: 420,  unit: 'mg/L',   name: 'Total Dissolved Solids (TDS)', maxScale: 1000 },
      conductivity: { value: 680,  unit: 'µS/cm',  name: 'Electrical Conductivity',    maxScale: 1500 }
    },

    after: {
      ph:           { value: 7.4,  unit: '',       name: 'pH Level',                  maxScale: 14 },
      turbidity:    { value: 18.0, unit: 'NTU',    name: 'Turbidity',                  maxScale: 100 },
      tds:          { value: 390,  unit: 'mg/L',   name: 'Total Dissolved Solids (TDS)', maxScale: 1000 },
      conductivity: { value: 630,  unit: 'µS/cm',  name: 'Electrical Conductivity',    maxScale: 1500 }
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     CALCULATION HELPERS
     ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Calculate percentage reduction.
   * Returns null if beforeVal is zero or invalid.
   */
  function pctReduction(beforeVal, afterVal) {
    if (typeof beforeVal !== 'number' || typeof afterVal !== 'number') return null;
    if (beforeVal === 0) return null;
    return ((beforeVal - afterVal) / beforeVal) * 100;
  }

  /**
   * Calculate absolute difference (after - before).
   */
  function absDiff(beforeVal, afterVal) {
    if (typeof beforeVal !== 'number' || typeof afterVal !== 'number') return null;
    return afterVal - beforeVal;
  }

  /**
   * Build the change indicator pill HTML for each parameter.
   * pH — show absolute difference; not auto-labelled as good/bad.
   * Turbidity / TDS — percentage reduction (lower is typically less turbid / fewer solids).
   * Conductivity — percentage change.
   */
  function buildChangePill(paramKey, beforeVal, afterVal) {
    if (typeof beforeVal !== 'number' || typeof afterVal !== 'number') {
      return '<span class="wq-change-pill neutral">Data unavailable</span>';
    }

    if (paramKey === 'ph') {
      const diff = absDiff(beforeVal, afterVal);
      if (diff === null) return '<span class="wq-change-pill neutral">—</span>';
      const sign = diff > 0 ? '+' : '';
      return `<span class="wq-change-pill neutral">${sign}${diff.toFixed(2)} pH units</span>`;
    }

    const pct = pctReduction(beforeVal, afterVal);
    if (pct === null) return '<span class="wq-change-pill neutral">—</span>';

    const abs = Math.abs(pct).toFixed(1);
    if (pct > 0) {
      return `<span class="wq-change-pill reduction">↓ ${abs}% reduction</span>`;
    } else if (pct < 0) {
      return `<span class="wq-change-pill increase">↑ ${Math.abs(pct).toFixed(1)}% increase</span>`;
    }
    return '<span class="wq-change-pill neutral">No change</span>';
  }

  /**
   * Bar fill percentage (capped 2%–100% so zero values still show a tiny bar).
   */
  function barPct(value, maxScale) {
    if (typeof value !== 'number' || maxScale <= 0) return 2;
    return Math.min(100, Math.max(2, (value / maxScale) * 100));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CHART RENDERING (HTML canvas — no external library needed)
     ══════════════════════════════════════════════════════════════════════════ */
  function drawComparisonChart(canvasId, label, beforeParam, afterParam) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const w = canvas.width  = parent.clientWidth  || 160;
    const h = canvas.height = parent.clientHeight || 90;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const beforeVal = (beforeParam && typeof beforeParam.value === 'number') ? beforeParam.value : null;
    const afterVal  = (afterParam  && typeof afterParam.value  === 'number') ? afterParam.value  : null;
    const maxScale  = (beforeParam && beforeParam.maxScale) ? beforeParam.maxScale : 100;

    if (beforeVal === null && afterVal === null) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Data unavailable', w / 2, h / 2);
      return;
    }

    const padL = 4, padR = 4, padT = 10, padB = 20;
    const chartH = h - padT - padB;
    const barW   = Math.floor((w - padL - padR - 16) / 2);

    // Grid line at midpoint
    const midY = padT + chartH / 2;
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, midY);
    ctx.lineTo(w - padR, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // BEFORE bar
    if (beforeVal !== null) {
      const bH = Math.max(4, (beforeVal / maxScale) * chartH);
      const bX = padL + 4;
      const bY = padT + chartH - bH;

      const grad1 = ctx.createLinearGradient(0, bY, 0, padT + chartH);
      grad1.addColorStop(0, '#F59E0B');
      grad1.addColorStop(1, '#D97706');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.roundRect(bX, bY, barW, bH, [3, 3, 0, 0]);
      ctx.fill();

      // Value label above bar
      ctx.fillStyle = '#172033';
      ctx.font = `bold 8px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(
        beforeVal % 1 === 0 ? beforeVal.toString() : beforeVal.toFixed(1),
        bX + barW / 2,
        Math.max(padT + 8, bY - 2)
      );
    }

    // AFTER bar
    if (afterVal !== null) {
      const aH = Math.max(4, (afterVal / maxScale) * chartH);
      const aX = padL + barW + 12;
      const aY = padT + chartH - aH;

      const grad2 = ctx.createLinearGradient(0, aY, 0, padT + chartH);
      grad2.addColorStop(0, '#14B8A6');
      grad2.addColorStop(1, '#0F766E');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.roundRect(aX, aY, barW, aH, [3, 3, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#172033';
      ctx.font = `bold 8px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(
        afterVal % 1 === 0 ? afterVal.toString() : afterVal.toFixed(1),
        aX + barW / 2,
        Math.max(padT + 8, aY - 2)
      );
    }

    // X-axis labels
    ctx.fillStyle = '#64748B';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    if (beforeVal !== null) ctx.fillText('Before', padL + 4 + barW / 2, h - 6);
    if (afterVal  !== null) ctx.fillText('After',  padL + barW + 12 + barW / 2, h - 6);

    // Baseline
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(padL, padT + chartH);
    ctx.lineTo(w - padR, padT + chartH);
    ctx.stroke();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER HELPERS
     ══════════════════════════════════════════════════════════════════════════ */

  function renderParamItem(paramKey, paramData, panelType) {
    if (!paramData) {
      return `
        <div class="wq-param-item">
          <div class="wq-param-row-top">
            <span class="wq-param-name">${paramKey}</span>
          </div>
          <span style="font-size:11px; color:var(--text-muted);">Data unavailable</span>
        </div>
      `;
    }

    const val = (typeof paramData.value === 'number') ? paramData.value : null;
    const displayVal = (val !== null)
      ? (val % 1 === 0 ? val.toString() : val.toFixed(paramKey === 'ph' ? 1 : 1))
      : '—';
    const pct = (val !== null) ? barPct(val, paramData.maxScale) : 2;

    return `
      <div class="wq-param-item">
        <div class="wq-param-row-top">
          <span class="wq-param-name">${paramData.name}</span>
          ${panelType === 'after' ? `<span style="font-size:9px; color:var(--text-muted);">vs Before</span>` : ''}
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px;">
          <div class="wq-param-value-group">
            <span class="wq-param-value">${displayVal}</span>
            ${paramData.unit ? `<span class="wq-param-unit">${paramData.unit}</span>` : ''}
          </div>
        </div>
        <div class="wq-param-bar-track">
          <div class="wq-param-bar-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }

  function formatTimestamp(ts) {
    if (!ts) return 'Unknown';
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) { return 'Unknown'; }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN RENDER FUNCTION — called from dashboard.js
     Supports rendering on both Main Dashboard and Water Quality page
     ══════════════════════════════════════════════════════════════════════════ */
  function render(state, containerId = 'overview-water-quality-section') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Use centralized SystemState comparison data if available, fallback to DEMO_DATA
    const dataSource = (state && state.waterQualityComparison) ? state.waterQualityComparison : DEMO_DATA;
    if (!dataSource.timestamp) dataSource.timestamp = new Date().toISOString();

    const isDemo = dataSource.isDemo !== false;
    const before = dataSource.before;
    const after  = dataSource.after;
    const ts     = formatTimestamp(dataSource.timestamp);

    // Calculate changes for each parameter
    const changes = {
      ph:           buildChangePill('ph',           before.ph.value,           after.ph.value),
      turbidity:    buildChangePill('turbidity',    before.turbidity.value,    after.turbidity.value),
      tds:          buildChangePill('tds',          before.tds.value,          after.tds.value),
      conductivity: buildChangePill('conductivity', before.conductivity.value, after.conductivity.value)
    };

    const PARAM_KEYS = ['ph', 'turbidity', 'tds', 'conductivity'];

    // Scoped IDs for elements within this container instance
    const idPrefix = containerId;

    container.innerHTML = `
      <!-- ═══════════════════════════════════════════════════════════════════
           BEFORE-AND-AFTER WATER QUALITY MONITORING
           ═══════════════════════════════════════════════════════════════════ -->
      <div id="${idPrefix}-ba-root">

        <!-- Section Header -->
        <div class="quality-panel" style="gap:8px;">
          <div class="card-header-clean">
            <div>
              <h3>WATER QUALITY MONITORING — BEFORE &amp; AFTER FILTRATION</h3>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                Direct comparative telemetry of influent raw greywater versus post-biofiltration effluent.
              </p>
            </div>
            <span class="demo-tag" style="white-space:nowrap;">DEMO DATA</span>
          </div>

          <!-- Demo Banner -->
          <div id="${idPrefix}-demo-banner-wrap">
            ${isDemo ? `
            <div class="wq-demo-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              DEMO DATA — NOT LIVE SENSOR READINGS &nbsp;|&nbsp; Values are illustrative examples only. Not experimentally verified filtration results.
            </div>` : ''}
          </div>
        </div>

        <!-- Before / After Panels -->
        <div class="wq-comparison-row" id="${idPrefix}-panels-row">

          <!-- BEFORE Panel -->
          <div class="wq-panel panel-before">
            <div class="wq-panel-header">
              <div>
                <div class="wq-panel-label">Before Filtration</div>
                <div class="wq-panel-title">Untreated Household Greywater</div>
                <div class="wq-panel-desc">Raw influent from household collection lines — pre-biofiltration</div>
              </div>
              <div class="wq-panel-status-dot"></div>
            </div>
            <div class="wq-param-list" id="${idPrefix}-before-params">
              ${PARAM_KEYS.map(k => renderParamItem(k, before[k], 'before')).join('')}
            </div>
            <div style="font-size:9.5px; color:var(--text-muted); font-family:var(--font-mono);">
              Last updated: <span>${ts}</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="wq-divider-col">
            <div class="wq-divider-line"></div>
            <div class="wq-divider-badge">➔</div>
            <div class="wq-divider-badge" style="margin-top:4px; background:var(--teal-treatment);">BIOFILTER</div>
            <div class="wq-divider-badge" style="margin-top:4px;">➔</div>
            <div class="wq-divider-line"></div>
          </div>

          <!-- AFTER Panel -->
          <div class="wq-panel panel-after">
            <div class="wq-panel-header">
              <div>
                <div class="wq-panel-label">After Filtration</div>
                <div class="wq-panel-title">Treated Water — Post Biofiltration</div>
                <div class="wq-panel-desc">Treated effluent after passing through multi-layer biofilter</div>
              </div>
              <div class="wq-panel-status-dot"></div>
            </div>
            <div class="wq-param-list" id="${idPrefix}-after-params">
              ${PARAM_KEYS.map(k => `
                ${renderParamItem(k, after[k], 'after')}
                <div style="margin-top:-4px; margin-bottom:4px;">${changes[k]}</div>
              `).join('')}
            </div>
            <div style="font-size:9.5px; color:var(--text-muted); font-family:var(--font-mono);">
              Last updated: <span>${ts}</span>
            </div>
          </div>

        </div><!-- end comparison row -->

        <!-- Comparison Charts -->
        <div class="wq-charts-section">
          <div class="card-header-clean">
            <h4>PARAMETER COMPARISON CHARTS</h4>
            <div class="wq-chart-legend">
              <div class="wq-legend-dot before"></div><span>Before</span>
              <div class="wq-legend-dot after" style="margin-left:4px;"></div><span>After</span>
              ${isDemo ? '<span class="demo-tag" style="margin-left:8px;">DEMO DATA</span>' : ''}
            </div>
          </div>
          <div class="wq-charts-grid">
            ${PARAM_KEYS.map(k => `
              <div class="wq-chart-card">
                <div class="wq-chart-card-title">${(before[k] || after[k] || {}).name || k}</div>
                <div style="width:100%; height:90px; position:relative;">
                  <canvas id="${idPrefix}-chart-${k}" style="width:100%;height:100%;"></canvas>
                </div>
                <div style="font-size:8.5px; color:var(--text-muted); font-family:var(--font-mono); text-align:center;">
                  ${(before[k] || {}).unit || ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Summary Strip -->
        <div class="wq-summary-strip">
          <div class="card-header-clean">
            <h4>WATER QUALITY CHANGE SUMMARY</h4>
            ${isDemo ? '<span class="demo-tag">DEMO DATA — NOT LIVE SENSOR READINGS</span>' : '<span class="kpi-status-tag ok">LIVE</span>'}
          </div>

          <div class="wq-summary-grid">
            <div class="wq-summary-box">
              <div class="wq-summary-lbl">Parameters Available</div>
              <div class="wq-summary-val">4 of 4</div>
              <div class="wq-summary-sub">pH · Turbidity · TDS · EC</div>
            </div>
            <div class="wq-summary-box">
              <div class="wq-summary-lbl">Last Measurement</div>
              <div class="wq-summary-val" style="font-size:11px;">${ts}</div>
              <div class="wq-summary-sub">Latest valid reading</div>
            </div>
            <div class="wq-summary-box">
              <div class="wq-summary-lbl">Data Source</div>
              <div class="wq-summary-val" style="font-size:11px; color:var(--status-amber);">
                ${isDemo ? 'DEMO DATA' : 'LIVE SENSORS'}
              </div>
              <div class="wq-summary-sub">
                ${isDemo ? 'Illustrative values only' : 'Real sensor readings'}
              </div>
            </div>
            <div class="wq-summary-box">
              <div class="wq-summary-lbl">Monitoring Status</div>
              <div class="wq-summary-val" style="font-size:11px; color:var(--status-green);">ACTIVE</div>
              <div class="wq-summary-sub">Dashboard operational</div>
            </div>
          </div>

          <div class="wq-summary-disclaimer">
            <strong style="color:var(--navy-primary);">Observed changes summary:</strong>
            Water quality measurements are available for 4 parameters. Observed changes are calculated from the latest valid before-and-after readings.
            <br>
            <strong style="color:var(--status-amber);">⚠ Important:</strong>
            ${isDemo
              ? 'This dashboard is displaying <strong>demonstration data</strong>. Values shown are illustrative examples, not measured results from the HydroSync 786 prototype. <strong>Do not claim that treated water is safe for drinking based only on these parameters.</strong> Treated greywater meeting CPCB / IS 10500 standards is certified safe for household non-potable flushing and landscape irrigation, not for potable human consumption.'
              : 'Readings are from connected sensors. Do not declare the treated water safe for drinking or any other unapproved use based solely on these four parameters.'
            }
          </div>
        </div>

      </div><!-- end root -->
    `;

    // Redraw charts using scoped IDs
    PARAM_KEYS.forEach(k => {
      drawComparisonChart(`${idPrefix}-chart-${k}`, k, before[k], after[k]);
    });
  }

  /**
   * Update displayed values without recreating the entire DOM.
   * Called on every render cycle.
   */
  function updateValues(before, after, changes, ts, paramKeys, isDemo) {
    // Before panel params
    const beforeContainer = document.getElementById('wq-before-params');
    if (beforeContainer) {
      beforeContainer.innerHTML = paramKeys.map(k => renderParamItem(k, before[k], 'before')).join('');
    }

    // After panel params
    const afterContainer = document.getElementById('wq-after-params');
    if (afterContainer) {
      afterContainer.innerHTML = paramKeys.map(k => `
        ${renderParamItem(k, after[k], 'after')}
        <div style="margin-top:-4px; margin-bottom:4px;">${changes[k]}</div>
      `).join('');
    }

    // Timestamps
    ['wq-before-ts', 'wq-after-ts', 'wq-sum-ts'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = ts;
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API — exposed on window for dashboard.js to call
     ══════════════════════════════════════════════════════════════════════════ */
  window.WaterQualityComparison = {
    render,
    // Clean integration point: call this with live sensor data to switch from demo mode.
    // setLiveData(data) {
    //   DEMO_DATA.isDemo = false;
    //   DEMO_DATA.before = data.before;
    //   DEMO_DATA.after  = data.after;
    //   DEMO_DATA.timestamp = data.timestamp || new Date().toISOString();
    // }
  };

})(window);
