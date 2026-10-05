/**
 * System History API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/history
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const result = await db.query(
      `SELECT * FROM system_history ORDER BY recorded_at DESC LIMIT $1`,
      [Math.min(limit, 200)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[API] Error reading system history:', err.message);
    res.status(500).json({ error: 'Failed to retrieve system history' });
  }
});

// POST /api/history
router.post('/', async (req, res) => {
  try {
    const {
      systemStage,
      selectedRoute,
      waterLevel,
      flowRate,
      floodCondition = 'normal',
      rechargeEnabled = true,
      floodshieldActive = false,
      systemHealth = 98
    } = req.body;

    if (!systemStage || !selectedRoute) {
      return res.status(400).json({ error: 'systemStage and selectedRoute are required' });
    }

    const result = await db.query(
      `INSERT INTO system_history (
        system_stage, selected_route, water_level, flow_rate,
        flood_condition, recharge_enabled, floodshield_active, system_health
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        systemStage, selectedRoute, waterLevel || 64.0, flowRate || 4.8,
        floodCondition, rechargeEnabled, floodshieldActive, systemHealth
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[API] Error recording history entry:', err.message);
    res.status(500).json({ error: 'Failed to record history entry' });
  }
});

module.exports = router;
