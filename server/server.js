/**
 * FLOWSHIELD–GREYLOOP | Backend Application Server
 * REST API & Real-time Persistence Gateway for Supabase PostgreSQL
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const systemRoutes = require('./routes/system');
const routingRoutes = require('./routes/routing');
const sensorsRoutes = require('./routes/sensors');
const alertsRoutes = require('./routes/alerts');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from workspace root
app.use(express.static(path.join(__dirname, '..')));

// REST API Endpoints
app.use('/api', systemRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/history', historyRoutes);

// Fallback index.html route for client routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server and Initialize Database
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`FLOWSHIELD–GREYLOOP SCADA Server running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);

  // Connect & initialize Supabase PostgreSQL tables
  await db.initDb();
});
