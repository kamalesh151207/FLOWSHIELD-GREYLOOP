/**
 * FLOWSHIELD–GREYLOOP | Supabase PostgreSQL Connection Pool & Migration Helper
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let connectionString = process.env.DATABASE_URL;

// Parse and format URI safely if needed
if (connectionString && !connectionString.includes('%40') && connectionString.includes('@')) {
  // Handle unencoded '@' in password if present
  const parts = connectionString.match(/^postgresql:\/\/([^:]+):(.*)@([^@]+)$/);
  if (parts) {
    const user = parts[1];
    const pass = parts[2];
    const hostPortDb = parts[3];
    connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hostPortDb}`;
  }
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle PostgreSQL client:', err.message);
});

async function initDb() {
  if (!connectionString) {
    console.warn('[DATABASE] DATABASE_URL not set in environment. Running in fallback mode.');
    return false;
  }

  try {
    const client = await pool.connect();
    console.log('[DATABASE] Successfully connected to Supabase PostgreSQL cluster.');
    
    // Read and run schema migrations
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('[DATABASE] Schema verified and initial state initialized.');
    }
    client.release();
    return true;
  } catch (err) {
    console.error('[DATABASE] Database initialization/connection warning:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb
};
