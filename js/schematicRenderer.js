/**
 * FLOWSHIELD–GREYLOOP | Professional Engineering SVG Schematic Renderer
 * Live 3-Way M3 Manual Route Visualizer with Dynamic Active Path Streaming
 */

(function (window) {
  'use strict';

  function renderSchematic(containerId, state) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentStageIdx = state.currentStageIndex;
    const isFlood = state.floodMode;
    const activeRoute = state.selectedRoute || 'reuse'; // 'reuse', 'recharge', 'bypass'

    // Component highlight styling
    const getStageStroke = (idx) => (currentStageIdx === idx ? '#2563EB' : '#CBD5E1');
    const getStageStrokeWidth = (idx) => (currentStageIdx === idx ? '2.5' : '1.5');
    const getStageFill = (idx) => (currentStageIdx === idx ? '#EFF6FF' : '#FFFFFF');

    // Route path active styles
    const isReuseActive = activeRoute === 'reuse';
    const isRechargeActive = activeRoute === 'recharge';
    const isBypassActive = activeRoute === 'bypass';

    const svgHTML = `
    <svg viewBox="0 0 1000 340" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; display:block;">
      <defs>
        <!-- Gradients -->
        <linearGradient id="water-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#0284C7" stop-opacity="0.95"/>
        </linearGradient>

        <linearGradient id="bio-layers-clean" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="25%" stop-color="#FEF3C7"/> <!-- Sand / Bagasse -->
          <stop offset="60%" stop-color="#CCFBF1"/> <!-- Biochar / Media -->
          <stop offset="100%" stop-color="#E2E8F0"/> <!-- Gravel -->
        </linearGradient>

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

      <!-- 11. RAISED CONCRETE PLINTH (ANTI-FLOOD BASELINE) -->
      <line x1="20" y1="305" x2="980" y2="305" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="4,4"/>
      <rect x="20" y="305" width="960" height="14" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" rx="2"/>
      <text x="35" y="316" fill="#64748B" font-family="Inter, sans-serif" font-size="8.5" font-weight="700">11. RAISED PLINTH BASELINE (ANTI-FLOOD ELEVATION)</text>

      <!-- ══════════════════════════════════════════════════════════════════════════
           MAIN HYDRAULIC PIPELINES (STAGE 01 - 05)
           ══════════════════════════════════════════════════════════════════════════ -->

      <!-- Main Treatment Pipe Line -->
      <path d="M 45 130 L 135 130 L 135 145 L 245 145 L 245 130 L 365 130 L 365 110 L 505 110 L 505 155 L 635 155" 
            fill="none" stroke="#CBD5E1" stroke-width="9" stroke-linejoin="round"/>
      <path d="M 45 130 L 135 130 L 135 145 L 245 145 L 245 130 L 365 130 L 365 110 L 505 110 L 505 155 L 635 155" 
            fill="none" stroke="#0EA5E9" stroke-width="4" stroke-linejoin="round" stroke-dasharray="6,4">
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
      </path>

      <!-- 1. GREYWATER INLET -->
      <g transform="translate(30, 80)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(0)">
        <rect x="0" y="0" width="82" height="90" fill="${getStageFill(0)}" stroke="${getStageStroke(0)}" stroke-width="${getStageStrokeWidth(0)}" rx="6"/>
        <text x="41" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">1. INLET</text>
        <path d="M 12 45 L 65 45" stroke="#0EA5E9" stroke-width="3" marker-end="url(#arrow-blue)"/>
        <text x="41" y="68" fill="#64748B" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">HOUSEHOLD</text>
        <circle cx="68" cy="16" r="6" fill="#EFF6FF" stroke="#2563EB" stroke-width="1"/>
        <text x="68" y="19" fill="#2563EB" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">S1</text>
      </g>

      <!-- 2. PREFILTER & GREASE TRAP -->
      <g transform="translate(132, 80)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(1)">
        <rect x="0" y="0" width="90" height="120" fill="${getStageFill(1)}" stroke="${getStageStroke(1)}" stroke-width="${getStageStrokeWidth(1)}" rx="6"/>
        <text x="45" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">2. PREFILTER</text>
        <!-- Mesh Screen Filter -->
        <line x1="12" y1="38" x2="78" y2="92" stroke="#D97706" stroke-width="1.5" stroke-dasharray="3,3"/>
        <line x1="12" y1="92" x2="78" y2="38" stroke="#D97706" stroke-width="1.5" stroke-dasharray="3,3"/>
        <text x="45" y="110" fill="#64748B" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">GREASE TRAP</text>
        <circle cx="76" cy="16" r="6" fill="#EFF6FF" stroke="#2563EB" stroke-width="1"/>
        <text x="76" y="19" fill="#2563EB" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">S2</text>
      </g>

      <!-- 3. SETTLING CHAMBER -->
      <g transform="translate(242, 80)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(2)">
        <rect x="0" y="0" width="100" height="120" fill="${getStageFill(2)}" stroke="${getStageStroke(2)}" stroke-width="${getStageStrokeWidth(2)}" rx="6"/>
        <text x="50" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">3. SETTLING</text>
        <!-- Baffle Wall -->
        <rect x="46" y="28" width="8" height="62" fill="#CBD5E1" rx="2"/>
        <path d="M 12 95 Q 50 105 88 95" fill="none" stroke="#94A3B8" stroke-width="2"/>
        <text x="50" y="110" fill="#64748B" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">SEDIMENT ZONE</text>
        <circle cx="86" cy="16" r="6" fill="#EFF6FF" stroke="#2563EB" stroke-width="1"/>
        <text x="86" y="19" fill="#2563EB" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">S3</text>
      </g>

      <!-- 4. VERTICAL BIOFILTER (CENTRAL MULTI-LAYER MODULE) -->
      <g transform="translate(362, 50)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(3)">
        <rect x="0" y="0" width="134" height="175" fill="url(#bio-layers-clean)" stroke="${getStageStroke(3)}" stroke-width="${getStageStrokeWidth(3)}" rx="8"/>
        <text x="67" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="10" font-weight="700" text-anchor="middle">4. BIOFILTER</text>
        
        <!-- Multi-layer Representation -->
        <line x1="6" y1="40" x2="128" y2="40" stroke="#D97706" stroke-dasharray="2,2"/>
        <text x="67" y="36" fill="#D97706" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">DISTRIBUTION & BIOCHAR</text>
        
        <line x1="6" y1="75" x2="128" y2="75" stroke="#0F766E" stroke-dasharray="2,2"/>
        <text x="67" y="71" fill="#0F766E" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">BAGASSE & RICE HUSK</text>

        <line x1="6" y1="120" x2="128" y2="120" stroke="#2563EB" stroke-dasharray="2,2"/>
        <text x="67" y="115" fill="#2563EB" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">SAND & GRAVEL</text>

        <!-- Plant Root Zone Graphic -->
        <text x="67" y="152" fill="#16A34A" font-family="Inter, sans-serif" font-size="8" font-weight="700" text-anchor="middle">🌱 ROOT ZONE (VETIVER)</text>

        <circle cx="118" cy="16" r="6" fill="#EFF6FF" stroke="#2563EB" stroke-width="1"/>
        <text x="118" y="19" fill="#2563EB" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">S4</text>
      </g>

      <!-- 5. TREATED WATER STORAGE TANK -->
      <g transform="translate(516, 80)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(4)">
        <rect x="0" y="0" width="118" height="120" fill="${getStageFill(4)}" stroke="${getStageStroke(4)}" stroke-width="${getStageStrokeWidth(4)}" rx="6"/>
        <!-- Animated Water Level -->
        <rect x="4" y="${120 - (state.sensors.waterLevel * 1.0)}" width="110" height="${state.sensors.waterLevel * 1.0}" fill="url(#water-grad)" rx="3"/>
        <text x="59" y="18" fill="#12304A" font-family="Inter, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">5. STORAGE TANK</text>
        <text x="59" y="62" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="16" font-weight="800" text-anchor="middle">${state.sensors.waterLevel}%</text>
        <text x="59" y="78" fill="#E0F2FE" font-family="Inter, sans-serif" font-size="8" font-weight="600" text-anchor="middle">TREATED WATER</text>
        <circle cx="104" cy="16" r="6" fill="#EFF6FF" stroke="#2563EB" stroke-width="1"/>
        <text x="104" y="19" fill="#2563EB" font-family="Inter, sans-serif" font-size="7" font-weight="700" text-anchor="middle">S5</text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           M3 TREATED WATER ROUTING CENTRAL JUNCTION NODE
           ══════════════════════════════════════════════════════════════════════════ -->

      <!-- Pipe from Storage into M3 Node -->
      <path d="M 634 150 L 668 150" fill="none" stroke="#0EA5E9" stroke-width="6"/>

      <!-- M3 Junction Box -->
      <g transform="translate(668, 120)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setStageIndex(5)">
        <rect x="0" y="0" width="68" height="60" fill="#FFFFFF" stroke="${currentStageIdx === 5 ? '#2563EB' : '#12304A'}" stroke-width="${currentStageIdx === 5 ? '2.5' : '1.5'}" rx="6"/>
        <rect x="4" y="4" width="60" height="16" fill="var(--navy-primary)" rx="3"/>
        <text x="34" y="15" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="8" font-weight="800" text-anchor="middle">M3 ROUTING</text>
        <text x="34" y="34" fill="#64748B" font-family="Inter, sans-serif" font-size="7.5" font-weight="600" text-anchor="middle">DESTINATION</text>
        <text x="34" y="48" fill="${isBypassActive ? '#DC2626' : (isRechargeActive ? '#16A34A' : '#2563EB')}" font-family="Inter, sans-serif" font-size="8" font-weight="800" text-anchor="middle">
          ${activeRoute.toUpperCase()}
        </text>
      </g>

      <!-- ══════════════════════════════════════════════════════════════════════════
           3-WAY MANUAL DISPATCH PATHWAYS (REUSE, RECHARGE, FLOODSHIELD BYPASS)
           ══════════════════════════════════════════════════════════════════════════ -->

      <!-- ─── PATH 1: M3 → REUSE (TOP BRANCH) ────────────────────────────── -->
      <path d="M 736 135 L 775 135 L 775 55 L 815 55" fill="none" 
            stroke="${isReuseActive ? '#2563EB' : '#E2E8F0'}" stroke-width="${isReuseActive ? 6 : 3}" stroke-linejoin="round"/>

      ${isReuseActive ? `
        <path d="M 736 135 L 775 135 L 775 55 L 815 55" fill="none" stroke="#2563EB" stroke-width="3" stroke-dasharray="6,4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.9s" repeatCount="indefinite" />
        </path>
      ` : ''}

      <g transform="translate(815, 30)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setManualRoute('reuse')">
        <rect x="0" y="0" width="165" height="48" fill="${isReuseActive ? '#EFF6FF' : '#FFFFFF'}" 
              stroke="${isReuseActive ? '#2563EB' : '#E2E8F0'}" stroke-width="${isReuseActive ? '2' : '1.2'}" rx="6"/>
        <text x="14" y="20" fill="${isReuseActive ? '#2563EB' : '#64748B'}" font-family="Inter, sans-serif" font-size="9.5" font-weight="700">
          ROUTE 1 — REUSE
        </text>
        <text x="14" y="36" fill="#64748B" font-family="Inter, sans-serif" font-size="8">
          Flushing & Landscape Irrigation
        </text>
        <circle cx="150" cy="24" r="7" fill="${isReuseActive ? '#2563EB' : '#E2E8F0'}"/>
        <circle cx="150" cy="24" r="3" fill="#FFFFFF"/>
      </g>

      <!-- ─── PATH 2: M3 → RECHARGE CONTROL → GROUNDWATER (MIDDLE BRANCH) ── -->
      <path d="M 736 150 L 760 150" fill="none" 
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
        <path d="M 736 150 L 815 150" fill="none" stroke="#16A34A" stroke-width="3" stroke-dasharray="6,4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.9s" repeatCount="indefinite" />
        </path>
      ` : ''}

      <g transform="translate(815, 122)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setManualRoute('recharge')">
        <rect x="0" y="0" width="165" height="54" fill="${isFlood ? '#FEF2F2' : (isRechargeActive ? '#F0FDF4' : '#FFFFFF')}" 
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
        <circle cx="150" cy="27" r="7" fill="${isFlood ? '#DC2626' : (isRechargeActive ? '#16A34A' : '#E2E8F0')}"/>
        <circle cx="150" cy="27" r="3" fill="#FFFFFF"/>
      </g>

      <!-- ─── PATH 3: M3 → FLOODSHIELD → CONTROLLED BYPASS (LOWER BRANCH) ─ -->
      <path d="M 736 165 L 775 165 L 775 235 L 815 235" fill="none" 
            stroke="${isBypassActive ? '#DC2626' : '#E2E8F0'}" stroke-width="${isBypassActive ? 6 : 3}" stroke-linejoin="round"/>

      ${isBypassActive ? `
        <path d="M 736 165 L 775 165 L 775 235 L 815 235" fill="none" stroke="#DC2626" stroke-width="3" stroke-dasharray="6,4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.9s" repeatCount="indefinite" />
        </path>
      ` : ''}

      <g transform="translate(815, 210)" style="cursor:pointer" onclick="window.SimulationService && window.SimulationService.setManualRoute('bypass')">
        <rect x="0" y="0" width="165" height="52" fill="${isBypassActive ? '#FEE2E2' : '#FFFFFF'}" 
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
        <circle cx="150" cy="26" r="7" fill="${isBypassActive ? '#DC2626' : '#E2E8F0'}"/>
        <circle cx="150" cy="26" r="3" fill="#FFFFFF"/>
      </g>

    </svg>
    `;

    container.innerHTML = svgHTML;
  }

  window.SchematicRenderer = { renderSchematic };
})(window);
