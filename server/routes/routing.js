/**
 * M3 Water Routing API Endpoints
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/routing
router.get('/', async (req, res) => {
  try {
    const stateResult = await db.query('SELECT selected_route, routing_mode, flood_condition, recharge_enabled, floodshield_active, bypass_active FROM system_state WHERE id = 1');
    const eventsResult = await db.query('SELECT * FROM routing_events ORDER BY created_at DESC LIMIT 10');

    const state = stateResult.rows[0] || {};
    res.json({
      selectedRoute: state.selected_route || 'reuse',
      routingMode: state.routing_mode || 'manual',
      floodCondition: state.flood_condition || 'normal',
      rechargeEnabled: state.recharge_enabled || false,
      floodshieldActive: state.floodshield_active || false,
      bypassActive: state.bypass_active || false,
      recentEvents: eventsResult.rows
    });
  } catch (err) {
    console.error('[API] Error fetching routing state:', err.message);
    res.status(500).json({ error: 'Failed to retrieve routing state' });
  }
});

// POST /api/routing
router.post('/', async (req, res) => {
  try {
    const { route, mode, reason } = req.body;

    const validRoutes = ['reuse', 'recharge', 'bypass'];
    const validModes = ['manual', 'automatic'];

    if (!route || !validRoutes.includes(route.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid route destination. Allowed values: ${validRoutes.join(', ')}`
      });
    }

    const targetRoute = route.toLowerCase();
    const targetMode = mode && validModes.includes(mode.toLowerCase()) ? mode.toLowerCase() : 'manual';

    // 1. Fetch current system state from database
    const stateResult = await db.query('SELECT * FROM system_state WHERE id = 1');
    if (stateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'System state not initialized' });
    }

    const currentState = stateResult.rows[0];
    const previousRoute = currentState.selected_route;
    const isFlood = currentState.flood_condition === 'flood';

    // 2. Enforce Server-Side Safety Priority Rule
    if (isFlood && targetRoute === 'recharge') {
      return res.status(400).json({
        success: false,
        error: 'Groundwater recharge is blocked during flood/saturated ground conditions. Safety override active.'
      });
    }

    // 3. Compute destination parameters
    let rechargeEnabled = false;
    let floodshieldActive = false;
    let bypassActive = false;

    if (targetRoute === 'reuse') {
      rechargeEnabled = false;
      floodshieldActive = false;
      bypassActive = false;
    } else if (targetRoute === 'recharge') {
      rechargeEnabled = true;
      floodshieldActive = false;
      bypassActive = false;
    } else if (targetRoute === 'bypass') {
      rechargeEnabled = false;
      floodshieldActive = true;
      bypassActive = true;
    }

    // 4. Update system_state
    const updateResult = await db.query(
      `UPDATE system_state 
       SET selected_route = $1, routing_mode = $2, recharge_enabled = $3, 
           floodshield_active = $4, bypass_active = $5, updated_at = NOW() 
       WHERE id = 1 RETURNING *`,
      [targetRoute, targetMode, rechargeEnabled, floodshieldActive, bypassActive]
    );

    // 5. Insert routing event into history
    const eventReason = reason || (targetMode === 'manual' ? 'Operator manual route selection' : 'Automatic logic dispatch');
    await db.query(
      `INSERT INTO routing_events (previous_route, new_route, routing_mode, reason, system_condition)
       VALUES ($1, $2, $3, $4, $5)`,
      [previousRoute, targetRoute, targetMode, eventReason, isFlood ? 'flood' : 'normal']
    );

    const updated = updateResult.rows[0];
    res.json({
      success: true,
      data: {
        selectedRoute: updated.selected_route,
        routingMode: updated.routing_mode,
        rechargeEnabled: updated.recharge_enabled,
        floodshieldActive: updated.floodshield_active,
        bypassActive: updated.bypass_active,
        floodCondition: updated.flood_condition,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    console.error('[API] Error processing route dispatch:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error while processing route' });
  }
});

module.exports = router;
