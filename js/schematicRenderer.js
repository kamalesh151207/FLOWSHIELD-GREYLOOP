/**
 * FLOWSHIELD–GREYLOOP | Professional Engineering SVG Schematic Renderer
 * Dynamic 6-Stage Process Flow Visualizer with Active Stage Highlighting,
 * Animated Hydraulic Flow Stream, and Live 3-Way M3 Destination Dispatch.
 */

(function (window) {
  'use strict';

  function renderSchematic(containerId, state) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentStageIdx = state.currentStageIndex;
    const isFlood = state.floodMode;
    const activeRoute = state.selectedRoute || 'reuse'; // 'reuse', 'recharge', 'bypass'

    // Node state styles
    const getStageState = (idx) => {
      if (idx === currentStageIdx) return 'active';
      if (idx < currentStageIdx) return 'completed';
      return 'upcoming';
    };

    const getStageStroke = (idx) => {
      const st = getStageState(idx);
      if (st === 'active') return '#2563EB';
      if (st === 'completed') return '#16A34A';
      return '#CBD5E1';
    };

    const getStageStrokeWidth = (idx) => (idx === currentStageIdx ? '3' : '1.5');
    const getStageFill = (idx) => {
      if (idx === currentStageIdx) return '#EFF6FF';
      if (idx < currentStageIdx) return '#F0FDF4';
      return '#FFFFFF';
    };

    // Route path active styles
    const isReuseActive = activeRoute === 'reuse';
    const isRechargeActive = !isFlood && activeRoute === 'recharge';
    const isBypassActive = isFlood || activeRoute === 'bypass';

    // Calculate dynamic water flow path length according to active stage
    const pipePoints = [
      "M 45 130 L 135 130", // Stage 0 -> 1
      "L 135 145 L 245 145", // Stage 1 -> 2
      "L 245 130 L 365 130", // Stage 2 -> 3
      "L 365 110 L 505 110", // Stage 3 -> 4
      "L 505 155 L 635 155", // Stage 4 -> 5
      "L 668 155"           // Into M3
    ];

    const activePipePath = pipePoints.slice(0, Math.min(currentStageIdx + 1, pipePoints.length)).join(' ');

    const svgHTML = `
    <svg viewBox="0 0 1000 340" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; display:block;" role="img" aria-label="FLOWSHIELD-GREYLOOP System Process Schematic">
      <defs>
        <!-- Gradients -->
        <linearGradient id="water-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#0284C7" stop-opacity="0.98"/>
        </linearGradient>

        <linearGradient id="bio-layers-clean" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="25%" stop-color="#FEF3C7"/> <!-- Sand / Bagasse -->
          <stop offset="60%" stop-color="#CCFBF1"/> <!-- Biochar / Media -->
          <stop offset="100%" stop-color="#E2E8F0"/> <!-- Gravel -->
        </linearGradient>

        <filter id="active-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#2563EB" flood-opacity="0.25"/>
        </filter>

        <!-- Arrow Markers -->
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0EA5E9"/>
        </marker>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#16A34A"/>
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626"/>
        </marker>
      </defs>

      <!-- Engineering Blueprint Background -->
      <rect width="1000" height="340" fill="#FAFAFC"/>
      <pattern id="grid-eng" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" stroke-width="1"/>
      </pattern>
      <rect width="1000" height="340" fill="url(#grid-eng)"/>

      <!-- RAISED CONCRETE PLINTH (ANTI-FLOOD BASELINE) -->
      <line x1="20" y1="305" x2="980" y2="305" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="4,4"/>
      <rect x="20" y="305" width="960" height="14" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" rx="2"/>
      <text x="35" y="316" fill="#64748B" font-family="Inter, sans-serif" font-size="8.5" font-weight="700">RAISED PLINTH BASELINE (ANTI-FLOOD ELEVATION)</text>

      <!-- ══════════════════════════════════════════════════════════════════════════
           MAIN HYDRAULIC PIPELINES (STAGE 01 - 05)
           ══════════════════════════════════════════════════════════════════════════ -->

      <!-- Background Pipeline Gray Housing -->
      <path d="M 45 130 L 135 130 L 135 145 L 245 145 L 245 130 L 365 130 L 365 110 L 505 110 L 505 155 L 668 155" 
            fill="none" stroke="#E2E8F0" stroke-width="8" stroke-linejoin="round"/>

      <!-- Animated Water Stream in Active Path -->
      <path d="${activePipePath}" 
            fill="none" stroke="#0EA5E9" stroke-width="4" stroke-linejoin="round" stroke-dasharray="6,4">
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
      </path>

      <!-- ══════════════════════════════════════════════════════════════════════════
           STAGE 01: GREYWATER INLET
           ══════════════════════════════════════════════════════════════════════════ -->
      <g transform="translate(30, 80)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(0)" ${currentStageIdx === 0 ? 'filter="url(#active-glow)"' : ''}>
        <rect x="0" y="0" width="84" height="92" fill="${getStageFill(0)}" stroke="${getStageStroke(0)}" stroke-width="${getStageStrokeWidth(0)}" rx="6"/>
        <text x="42" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9" font-weight="800" text-anchor="middle">1. INLET</text>
        <path d="M 12 45 L 68 45" stroke="#0EA5E9" stroke-width="3" marker-end="url(#arrow-blue)"/>
        <text x="42" y="68" fill="#64748B" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">RAW WATER</text>
        
        <!-- Status Indicator Pill -->
        <circle cx="70" cy="16" r="6" fill="${currentStageIdx === 0 ? '#2563EB' : (currentStageIdx > 0 ? '#16A34A' : '#F1F5F9')}" stroke="${getStageStroke(0)}" stroke-width="1"/>
        <text x="70" y="19" fill="${currentStageIdx >= 0 ? '#FFFFFF' : '#64748B'}" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">
          ${currentStageIdx > 0 ? '✓' : 'S1'}
        </text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           STAGE 02: PREFILTER & GREASE TRAP
           ══════════════════════════════════════════════════════════════════════════ -->
      <g transform="translate(132, 75)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(1)" ${currentStageIdx === 1 ? 'filter="url(#active-glow)"' : ''}>
        <rect x="0" y="0" width="92" height="126" fill="${getStageFill(1)}" stroke="${getStageStroke(1)}" stroke-width="${getStageStrokeWidth(1)}" rx="6"/>
        <text x="46" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9" font-weight="800" text-anchor="middle">2. PREFILTER</text>
        <!-- Mesh Screen Filter -->
        <line x1="12" y1="38" x2="80" y2="95" stroke="#D97706" stroke-width="1.5" stroke-dasharray="3,3"/>
        <line x1="12" y1="95" x2="80" y2="38" stroke="#D97706" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="46" y="112" fill="#64748B" font-family="Inter, sans-serif" font-size="7.5" text-anchor="middle">GREASE TRAP</text>
        
        <circle cx="78" cy="16" r="6" fill="${currentStageIdx === 1 ? '#2563EB' : (currentStageIdx > 1 ? '#16A34A' : '#F1F5F9')}" stroke="${getStageStroke(1)}" stroke-width="1"/>
        <text x="78" y="19" fill="${currentStageIdx >= 1 ? '#FFFFFF' : '#64748B'}" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">
          ${currentStageIdx > 1 ? '✓' : 'S2'}
        </text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           STAGE 03: SETTLING CHAMBER
           ══════════════════════════════════════════════════════════════════════════ -->
      <g transform="translate(242, 75)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(2)" ${currentStageIdx === 2 ? 'filter="url(#active-glow)"' : ''}>
        <rect x="0" y="0" width="102" height="126" fill="${getStageFill(2)}" stroke="${getStageStroke(2)}" stroke-width="${getStageStrokeWidth(2)}" rx="6"/>
        <text x="51" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9" font-weight="800" text-anchor="middle">3. SETTLING</text>
        <!-- Baffle Wall -->
        <rect x="47" y="28" width="8" height="66" fill="#CBD5E1" rx="2"/>
        <path d="M 12 98 Q 51 110 90 98" fill="none" stroke="#94A3B8" stroke-width="2"/>
        <text x="51" y="114" fill="#64748B" font-family="Inter, sans-serif" font-size="7.5" text-anchor="middle">BAFFLE CHAMBER</text>
        
        <circle cx="88" cy="16" r="6" fill="${currentStageIdx === 2 ? '#2563EB' : (currentStageIdx > 2 ? '#16A34A' : '#F1F5F9')}" stroke="${getStageStroke(2)}" stroke-width="1"/>
        <text x="88" y="19" fill="${currentStageIdx >= 2 ? '#FFFFFF' : '#64748B'}" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">
          ${currentStageIdx > 2 ? '✓' : 'S3'}
        </text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           STAGE 04: VERTICAL BIOFILTER
           ══════════════════════════════════════════════════════════════════════════ -->
      <g transform="translate(362, 45)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(3)" ${currentStageIdx === 3 ? 'filter="url(#active-glow)"' : ''}>
        <rect x="0" y="0" width="136" height="182" fill="url(#bio-layers-clean)" stroke="${getStageStroke(3)}" stroke-width="${getStageStrokeWidth(3)}" rx="8"/>
        <text x="68" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="10" font-weight="800" text-anchor="middle">4. BIOFILTER</text>
        
        <!-- Multi-layer Representation -->
        <line x1="6" y1="40" x2="130" y2="40" stroke="#D97706" stroke-dasharray="2,2"/>
        <text x="68" y="36" fill="#D97706" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">DISTRIBUTION & BIOCHAR</text>
        
        <line x1="6" y1="78" x2="130" y2="78" stroke="#0F766E" stroke-dasharray="2,2"/>
        <text x="68" y="74" fill="#0F766E" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">BAGASSE & RICE HUSK</text>

        <line x1="6" y1="125" x2="130" y2="125" stroke="#2563EB" stroke-dasharray="2,2"/>
        <text x="68" y="120" fill="#2563EB" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">SAND & GRAVEL MATRIX</text>

        <!-- Plant Root Zone Graphic -->
        <text x="68" y="156" fill="#16A34A" font-family="Inter, sans-serif" font-size="8" font-weight="800" text-anchor="middle">🌱 ROOT ZONE (VETIVER)</text>

        <circle cx="120" cy="16" r="6" fill="${currentStageIdx === 3 ? '#2563EB' : (currentStageIdx > 3 ? '#16A34A' : '#F1F5F9')}" stroke="${getStageStroke(3)}" stroke-width="1"/>
        <text x="120" y="19" fill="${currentStageIdx >= 3 ? '#FFFFFF' : '#64748B'}" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">
          ${currentStageIdx > 3 ? '✓' : 'S4'}
        </text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           STAGE 05: TREATED WATER STORAGE TANK
           ══════════════════════════════════════════════════════════════════════════ -->
      <g transform="translate(516, 75)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(4)" ${currentStageIdx === 4 ? 'filter="url(#active-glow)"' : ''}>
        <rect x="0" y="0" width="120" height="126" fill="${getStageFill(4)}" stroke="${getStageStroke(4)}" stroke-width="${getStageStrokeWidth(4)}" rx="6"/>
        
        <!-- Animated Water Level Fill -->
        <rect x="4" y="${126 - (state.sensors.waterLevel * 1.05)}" width="112" height="${state.sensors.waterLevel * 1.05}" fill="url(#water-grad)" rx="3"/>
        
        <text x="60" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9" font-weight="800" text-anchor="middle">5. STORAGE TANK</text>
        <text x="60" y="65" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="16" font-weight="800" text-anchor="middle">${typeof state.sensors.waterLevel === 'number' ? state.sensors.waterLevel.toFixed(1) : state.sensors.waterLevel}%</text>
        <text x="60" y="80" fill="#E0F2FE" font-family="Inter, sans-serif" font-size="7.5" font-weight="700" text-anchor="middle">TREATED WATER</text>
        
        <circle cx="106" cy="16" r="6" fill="${currentStageIdx === 4 ? '#2563EB' : (currentStageIdx > 4 ? '#16A34A' : '#F1F5F9')}" stroke="${getStageStroke(4)}" stroke-width="1"/>
        <text x="106" y="19" fill="${currentStageIdx >= 4 ? '#FFFFFF' : '#64748B'}" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">
          ${currentStageIdx > 4 ? '✓' : 'S5'}
        </text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           STAGE 06: M3 TREATED WATER ROUTING CENTRAL JUNCTION NODE
           ══════════════════════════════════════════════════════════════════════════ -->

      <!-- Pipe from Storage into M3 Node -->
      <path d="M 636 150 L 668 150" fill="none" stroke="#0EA5E9" stroke-width="6"/>

      <!-- M3 Junction Box -->
      <g transform="translate(668, 115)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(5)" ${currentStageIdx === 5 ? 'filter="url(#active-glow)"' : ''}>
        <rect x="0" y="0" width="72" height="70" fill="#FFFFFF" stroke="${currentStageIdx === 5 ? '#2563EB' : '#12304A'}" stroke-width="${currentStageIdx === 5 ? '3' : '1.5'}" rx="6"/>
        <rect x="4" y="4" width="64" height="18" fill="var(--navy-primary)" rx="3"/>
        <text x="36" y="16" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="8" font-weight="800" text-anchor="middle">M3 ROUTING</text>
        <text x="36" y="38" fill="#64748B" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">DESTINATION</text>
        <text x="36" y="54" fill="${isBypassActive ? '#DC2626' : (isRechargeActive ? '#16A34A' : '#2563EB')}" font-family="Inter, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle">
          ${activeRoute.toUpperCase()}
        </text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           3-WAY DISPATCH PATHWAYS (REUSE, RECHARGE, FLOODSHIELD BYPASS)
           ══════════════════════════════════════════════════════════════════════════ -->

      <!-- ─── PATH 1: M3 → REUSE (TOP BRANCH) ────────────────────────────── -->
      <path d="M 740 135 L 775 135 L 775 55 L 815 55" fill="none" 
            stroke="${isReuseActive ? '#2563EB' : '#E2E8F0'}" stroke-width="${isReuseActive ? 6 : 3}" stroke-linejoin="round"/>

      ${isReuseActive ? `
        <path d="M 740 135 L 775 135 L 775 55 L 815 55" fill="none" stroke="#2563EB" stroke-width="3" stroke-dasharray="6,4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.9s" repeatCount="indefinite" />
        </path>
      ` : ''}

      <g transform="translate(815, 30)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setManualRoute('reuse')">
        <rect x="0" y="0" width="168" height="48" fill="${isReuseActive ? '#EFF6FF' : '#FFFFFF'}" 
              stroke="${isReuseActive ? '#2563EB' : '#E2E8F0'}" stroke-width="${isReuseActive ? '2' : '1.2'}" rx="6"/>
        <text x="14" y="20" fill="${isReuseActive ? '#2563EB' : '#64748B'}" font-family="Inter, sans-serif" font-size="9.5" font-weight="700">
          ROUTE 1 — REUSE
        </text>
        <text x="14" y="36" fill="#64748B" font-family="Inter, sans-serif" font-size="8">
          Flushing & Landscape Irrigation
        </text>
        <circle cx="152" cy="24" r="7" fill="${isReuseActive ? '#2563EB' : '#E2E8F0'}"/>
        <circle cx="152" cy="24" r="3" fill="#FFFFFF"/>
      </g>

      <!-- ─── PATH 2: M3 → RECHARGE CONTROL → GROUNDWATER (MIDDLE BRANCH) ── -->
      <path d="M 740 150 L 760 150" fill="none" 
            stroke="${isRechargeActive ? '#16A34A' : '#E2E8F0'}" stroke-width="${isRechargeActive ? 6 : 3}"/>

      <!-- Check Valve -->
      <g transform="translate(755, 134)">
        <circle cx="16" cy="16" r="12" fill="#FFFFFF" stroke="${isFlood ? '#DC2626' : (isRechargeActive ? '#16A34A' : '#CBD5E1')}" stroke-width="2"/>
        <text x="16" y="20" fill="${isFlood ? '#DC2626' : (isRechargeActive ? '#16A34A' : '#64748B')}" font-family="Inter, sans-serif" font-size="7.5" font-weight="800" text-anchor="middle">
          ${isFlood ? 'BLKD' : (isRechargeActive ? 'ON' : 'OFF')}
        </text>
      </g>

      <path d="M 783 150 L 815 150" fill="none" 
            stroke="${isRechargeActive ? '#16A34A' : '#E2E8F0'}" stroke-width="${isRechargeActive ? 6 : 3}"/>

      ${isRechargeActive ? `
        <path d="M 740 150 L 815 150" fill="none" stroke="#16A34A" stroke-width="3" stroke-dasharray="6,4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.9s" repeatCount="indefinite" />
        </path>
      ` : ''}

      <g transform="translate(815, 122)" style="cursor:pointer" onclick="${isFlood ? '' : "window.SimulationService && window.SimulationService.setManualRoute('recharge')"}">
        <rect x="0" y="0" width="168" height="54" fill="${isFlood ? '#FEF2F2' : (isRechargeActive ? '#F0FDF4' : '#FFFFFF')}" 
              stroke="${isFlood ? '#FCA5A5' : (isRechargeActive ? '#16A34A' : '#E2E8F0')}" stroke-width="${isRechargeActive ? '2' : '1.2'}" rx="6"/>
        <text x="14" y="20" fill="${isFlood ? '#DC2626' : (isRechargeActive ? '#16A34A' : '#64748B')}" font-family="Inter, sans-serif" font-size="9.5" font-weight="700">
          ROUTE 2 — RECHARGE
        </text>
        <text x="14" y="35" fill="#64748B" font-family="Inter, sans-serif" font-size="8">
          ${isFlood ? 'BLOCKED (Soil Saturated 94%)' : 'Aquifer Infiltration Bed'}
        </text>
        <text x="14" y="46" fill="${isFlood ? '#DC2626' : '#16A34A'}" font-family="Inter, sans-serif" font-size="7.5" font-weight="700">
          ${isFlood ? 'SAFETY PROHIBITED' : (isRechargeActive ? '● ACTIVE ROUTE' : '○ STANDBY')}
        </text>
        <circle cx="152" cy="27" r="7" fill="${isFlood ? '#DC2626' : (isRechargeActive ? '#16A34A' : '#E2E8F0')}"/>
        <circle cx="152" cy="27" r="3" fill="#FFFFFF"/>
      </g>

      <!-- ─── PATH 3: M3 → FLOODSHIELD → CONTROLLED BYPASS (LOWER BRANCH) ─ -->
      <path d="M 740 165 L 775 165 L 775 235 L 815 235" fill="none" 
            stroke="${isBypassActive ? '#DC2626' : '#E2E8F0'}" stroke-width="${isBypassActive ? 6 : 3}" stroke-linejoin="round"/>

      ${isBypassActive ? `
        <path d="M 740 165 L 775 165 L 775 235 L 815 235" fill="none" stroke="#DC2626" stroke-width="3" stroke-dasharray="6,4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.9s" repeatCount="indefinite" />
        </path>
      ` : ''}

      <g transform="translate(815, 210)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setManualRoute('bypass')">
        <rect x="0" y="0" width="168" height="52" fill="${isBypassActive ? '#FEE2E2' : '#FFFFFF'}" 
              stroke="${isBypassActive ? '#DC2626' : '#E2E8F0'}" stroke-width="${isBypassActive ? '2' : '1.2'}" rx="6"/>
        <text x="14" y="20" fill="${isBypassActive ? '#DC2626' : '#64748B'}" font-family="Inter, sans-serif" font-size="9" font-weight="700">
          ROUTE 3 — FLOODSHIELD BYPASS
        </text>
        <text x="14" y="35" fill="#64748B" font-family="Inter, sans-serif" font-size="8">
          Storm Drain Controlled Diversion
        </text>
        <text x="14" y="46" fill="${isBypassActive ? '#DC2626' : '#64748B'}" font-family="Inter, sans-serif" font-size="7.5" font-weight="700">
          ${isBypassActive ? '● ACTIVE DIVERSION' : '○ STANDBY'}
        </text>
        <circle cx="152" cy="26" r="7" fill="${isBypassActive ? '#DC2626' : '#E2E8F0'}"/>
        <circle cx="152" cy="26" r="3" fill="#FFFFFF"/>
      </g>
    </svg>
    `;

    container.innerHTML = svgHTML;
  }

  window.SchematicRenderer = {
    renderSchematic
  };

})(window);
