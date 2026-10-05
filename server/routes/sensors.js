/**
 * Sensor Telemetry API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/sensors/latest
router.get('/latest', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sensor_readings ORDER BY recorded_at DESC LIMIT 1');
    if (result.rows.length === 0) {
      // Return nominal initial demo state
      return res.json({
        waterLevel: 64.0,
        flowRate: 4.8,
        inletLevel: 72.0,
        outletLevel: 48.0,
        temperature: 29.4,
        humidity: 68.0,
        soilMoisture: 38.0,
        storageLevel: 64.0,
        floodCondition: 'NORMAL',
        rechargeStatus: 'ENABLED',
        bypassStatus: 'STANDBY',
        isDemo: true,
        recordedAt: new Date().toISOString()
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      waterLevel: parseFloat(row.water_level),
      flowRate: parseFloat(row.flow_rate),
      inletLevel: parseFloat(row.inlet_level),
      outletLevel: parseFloat(row.outlet_level),
      temperature: parseFloat(row.temperature),
      humidity: parseFloat(row.humidity),
      soilMoisture: parseFloat(row.soil_moisture),
      storageLevel: parseFloat(row.storage_level),
      floodCondition: row.flood_condition,
      rechargeStatus: row.recharge_status,
      bypassStatus: row.bypass_status,
      isDemo: row.is_demo,
      recordedAt: row.recorded_at
    });
  } catch (err) {
    console.error('[API] Error reading latest sensor data:', err.message);
    res.status(500).json({ error: 'Failed to retrieve sensor reading' });
  }
});

// GET /api/sensors/history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const result = await db.query(
      'SELECT * FROM sensor_readings ORDER BY recorded_at DESC LIMIT $1',
      [Math.min(limit, 100)]
    );

    // Return in chronological order
    const readings = result.rows.reverse().map(row => ({
      id: row.id,
      waterLevel: parseFloat(row.water_level),
      flowRate: parseFloat(row.flow_rate),
      soilMoisture: parseFloat(row.soil_moisture),
      floodCondition: row.flood_condition,
      recordedAt: row.recorded_at
    }));

    res.json(readings);
  } catch (err) {
    console.error('[API] Error reading sensor history:', err.message);
    res.status(500).json({ error: 'Failed to retrieve sensor history' });
  }
});

// POST /api/sensors (Record periodic reading from simulation or hardware)
router.post('/', async (req, res) => {
  try {
    const {
      waterLevel,
      flowRate,
      inletLevel = 72.0,
      outletLevel = 48.0,
      temperature = 29.4,
      humidity = 68.0,
      soilMoisture = 38.0,
      storageLevel = 64.0,
      floodCondition = 'NORMAL',
      rechargeStatus = 'ENABLED',
      bypassStatus = 'STANDBY',
      isDemo = true
    } = req.body;

    if (waterLevel === undefined || flowRate === undefined) {
      return res.status(400).json({ error: 'waterLevel and flowRate are required' });
    }

    const result = await db.query(
      `INSERT INTO sensor_readings (
        water_level, flow_rate, inlet_level, outlet_level, temperature,
        humidity, soil_moisture, storage_level, flood_condition,
        recharge_status, bypass_status, is_demo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        waterLevel, flowRate, inletLevel, outletLevel, temperature,
        humidity, soilMoisture, storageLevel, floodCondition,
        rechargeStatus, bypassStatus, isDemo
      ]
    );

    // Also update water_level and flow_rate in system_state table
    await db.query(
      'UPDATE system_state SET water_level = $1, flow_rate = $2, updated_at = NOW() WHERE id = 1',
      [waterLevel, flowRate]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[API] Error recording sensor data:', err.message);
    res.status(500).json({ error: 'Failed to record sensor reading' });
  }
});

module.exports = router;
