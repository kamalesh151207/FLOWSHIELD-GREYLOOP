/**
 * System Alerts API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM system_alerts ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[API] Error retrieving alerts:', err.message);
    res.status(500).json({ error: 'Failed to retrieve system alerts' });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const { severity = 'info', title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Alert title and message are required' });
    }

    const validSeverities = ['info', 'warning', 'critical'];
    const targetSeverity = validSeverities.includes(severity) ? severity : 'info';

    // Prevent duplicate active alerts within 1 minute
    const duplicateCheck = await db.query(
      `SELECT id FROM system_alerts 
       WHERE title = $1 AND status = 'active' AND created_at > NOW() - INTERVAL '1 minute'`,
      [title]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.json({ success: true, duplicate: true, alert: duplicateCheck.rows[0] });
    }

    const result = await db.query(
      `INSERT INTO system_alerts (severity, title, message, status) 
       VALUES ($1, $2, $3, 'active') RETURNING *`,
      [targetSeverity, title, message]
    );

    res.status(201).json({ success: true, alert: result.rows[0] });
  } catch (err) {
    console.error('[API] Error creating alert:', err.message);
    res.status(500).json({ error: 'Failed to record alert' });
  }
});

// PATCH /api/alerts/:id (Resolve alert)
router.patch('/:id', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id, 10);
    const { status = 'resolved' } = req.body;

    const result = await db.query(
      `UPDATE system_alerts 
       SET status = $1, resolved_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [status, alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, alert: result.rows[0] });
  } catch (err) {
    console.error('[API] Error updating alert:', err.message);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

module.exports = router;
