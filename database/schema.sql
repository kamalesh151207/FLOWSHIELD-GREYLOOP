-- FLOWSHIELD–GREYLOOP Database Schema
-- Supabase PostgreSQL Schema Definition

-- 1. system_state table
CREATE TABLE IF NOT EXISTS system_state (
    id SERIAL PRIMARY KEY,
    system_status VARCHAR(50) DEFAULT 'OPERATIONAL',
    current_stage VARCHAR(50) DEFAULT 'biofilter',
    routing_mode VARCHAR(20) DEFAULT 'manual' CHECK (routing_mode IN ('manual', 'automatic')),
    selected_route VARCHAR(20) DEFAULT 'reuse' CHECK (selected_route IN ('reuse', 'recharge', 'bypass')),
    water_level NUMERIC(5,2) DEFAULT 64.0,
    flow_rate NUMERIC(5,2) DEFAULT 4.8,
    flood_condition VARCHAR(20) DEFAULT 'normal' CHECK (flood_condition IN ('normal', 'flood')),
    recharge_enabled BOOLEAN DEFAULT true,
    floodshield_active BOOLEAN DEFAULT false,
    bypass_active BOOLEAN DEFAULT false,
    system_health INTEGER DEFAULT 98,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    water_level NUMERIC(5,2) NOT NULL,
    flow_rate NUMERIC(5,2) NOT NULL,
    inlet_level NUMERIC(5,2) DEFAULT 72.0,
    outlet_level NUMERIC(5,2) DEFAULT 48.0,
    temperature NUMERIC(5,2) DEFAULT 29.4,
    humidity NUMERIC(5,2) DEFAULT 68.0,
    soil_moisture NUMERIC(5,2) DEFAULT 38.0,
    storage_level NUMERIC(5,2) DEFAULT 64.0,
    flood_condition VARCHAR(20) DEFAULT 'NORMAL',
    recharge_status VARCHAR(20) DEFAULT 'ENABLED',
    bypass_status VARCHAR(20) DEFAULT 'STANDBY',
    is_demo BOOLEAN DEFAULT true,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. routing_events table
CREATE TABLE IF NOT EXISTS routing_events (
    id SERIAL PRIMARY KEY,
    previous_route VARCHAR(20) NOT NULL,
    new_route VARCHAR(20) NOT NULL,
    routing_mode VARCHAR(20) DEFAULT 'manual',
    reason VARCHAR(255) DEFAULT 'operator selection',
    system_condition VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id SERIAL PRIMARY KEY,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. system_history table
CREATE TABLE IF NOT EXISTS system_history (
    id SERIAL PRIMARY KEY,
    system_stage VARCHAR(50) NOT NULL,
    selected_route VARCHAR(20) NOT NULL,
    water_level NUMERIC(5,2) NOT NULL,
    flow_rate NUMERIC(5,2) NOT NULL,
    flood_condition VARCHAR(20) DEFAULT 'normal',
    recharge_enabled BOOLEAN DEFAULT true,
    floodshield_active BOOLEAN DEFAULT false,
    system_health INTEGER DEFAULT 98,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_routing_events_time ON routing_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_history_time ON system_history(recorded_at DESC);

-- Seed initial row in system_state if empty
INSERT INTO system_state (
    id, system_status, current_stage, routing_mode, selected_route, 
    water_level, flow_rate, flood_condition, recharge_enabled, 
    floodshield_active, bypass_active, system_health
)
SELECT 1, 'OPERATIONAL', 'biofilter', 'manual', 'reuse', 64.0, 4.8, 'normal', true, false, false, 98
WHERE NOT EXISTS (SELECT 1 FROM system_state WHERE id = 1);
