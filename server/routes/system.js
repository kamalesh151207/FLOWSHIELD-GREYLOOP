/**
 * System State & Health API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/health
router.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS current_time');
    res.json({
      server: 'online',
      database: 'connected',
      timestamp: result.rows[0].current_time
    });
  } catch (err) {
    res.status(200).json({
      server: 'online',
      database: 'disconnected',
      error: 'Database connection currently unavailable. Operating in demo fallback mode.'
    });
  }
});

// GET /api/system/state
router.get('/system/state', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM system_state ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System state not initialized' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      systemStatus: row.system_status,
      currentStage: row.current_stage,
      routingMode: row.routing_mode,
      selectedRoute: row.selected_route,
      waterLevel: parseFloat(row.water_level),
      flowRate: parseFloat(row.flow_rate),
      floodCondition: row.flood_condition,
      rechargeEnabled: row.recharge_enabled,
      floodshieldActive: row.floodshield_active,
      bypassActive: row.bypass_active,
      systemHealth: row.system_health,
      updatedAt: row.updated_at
    });
  } catch (err) {
    console.error('[API] Error reading system state:', err.message);
    res.status(500).json({ error: 'Failed to retrieve system state' });
  }
});

// PATCH /api/system/state
router.patch('/system/state', async (req, res) => {
  try {
    const {
      systemStatus,
      currentStage,
      routingMode,
      selectedRoute,
      waterLevel,
      flowRate,
      floodCondition,
      rechargeEnabled,
      floodshieldActive,
      bypassActive,
      systemHealth
    } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (systemStatus !== undefined) { fields.push(`system_status = $${idx++}`); values.push(systemStatus); }
    if (currentStage !== undefined) { fields.push(`current_stage = $${idx++}`); values.push(currentStage); }
    if (routingMode !== undefined) { fields.push(`routing_mode = $${idx++}`); values.push(routingMode); }
    if (selectedRoute !== undefined) { fields.push(`selected_route = $${idx++}`); values.push(selectedRoute); }
    if (waterLevel !== undefined) { fields.push(`water_level = $${idx++}`); values.push(waterLevel); }
    if (flowRate !== undefined) { fields.push(`flow_rate = $${idx++}`); values.push(flowRate); }
    if (floodCondition !== undefined) { fields.push(`flood_condition = $${idx++}`); values.push(floodCondition); }
    if (rechargeEnabled !== undefined) { fields.push(`recharge_enabled = $${idx++}`); values.push(rechargeEnabled); }
    if (floodshieldActive !== undefined) { fields.push(`floodshield_active = $${idx++}`); values.push(floodshieldActive); }
    if (bypassActive !== undefined) { fields.push(`bypass_active = $${idx++}`); values.push(bypassActive); }
    if (systemHealth !== undefined) { fields.push(`system_health = $${idx++}`); values.push(systemHealth); }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const queryText = `UPDATE system_state SET ${fields.join(', ')} WHERE id = 1 RETURNING *`;
    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System state not found' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        systemStatus: row.system_status,
        currentStage: row.current_stage,
        routingMode: row.routing_mode,
        selectedRoute: row.selected_route,
        waterLevel: parseFloat(row.water_level),
        flowRate: parseFloat(row.flow_rate),
        floodCondition: row.flood_condition,
        rechargeEnabled: row.recharge_enabled,
        floodshieldActive: row.floodshield_active,
        bypassActive: row.bypass_active,
        systemHealth: row.system_health,
        updatedAt: row.updated_at
      }
    });
  } catch (err) {
    console.error('[API] Error updating system state:', err.message);
    res.status(500).json({ error: 'Failed to update system state' });
  }
});

module.exports = router;
