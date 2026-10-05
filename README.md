# FLOWSHIELD–GREYLOOP 💧🌿
### Flood-Resilient, Minimum-Footprint Modular Greywater Management System
**Smart India Hackathon Project | Problem Statement: SIH26257 – Grey Water Management**

---

## 📌 Project Overview
**FLOWSHIELD–GREYLOOP** is an IoT-enabled, flood-resilient greywater treatment and management platform designed for rural households and land-constrained communities. The system captures household greywater (bathing, washing, kitchen), removes coarse suspended solids, settles sediment, purifies water through a compact multi-layer vertical biofilter, stores the treated effluent, and prioritizes safe non-potable reuse.

When soil permeability permits, excess treated water is directed towards controlled groundwater aquifer replenishment. During intense downpours, flooding, or soil-saturation events, the automated **FloodShield Protection System** immediately blocks aquifer recharge and safely diverts excess water through a controlled stormwater bypass—preventing conventional soak-pit backflow and flood overflow.

---

## 🌟 Key Features

### 1. Live SCADA Engineering Schematic
- **Dynamic Animated Flow Paths:** Interactive SVG schematic rendering real-time fluid streaming through all 5 treatment stages (Inlet $\rightarrow$ Prefilter $\rightarrow$ Settling $\rightarrow$ Biofilter $\rightarrow$ Storage Tank $\rightarrow$ M3 Routing).
- **M3 3-Way Routing Stage:** Live visual dispatching to:
  - `ROUTE 1 — REUSE`: Direct non-potable household reuse (flushing & landscape irrigation).
  - `ROUTE 2 — GROUNDWATER RECHARGE`: Controlled sub-surface aquifer infiltration with valve telemetry.
  - `ROUTE 3 — FLOODSHIELD BYPASS`: Automated stormwater diversion during storm events.

### 2. Operator-Controlled M3 Water Routing
- **Compact 3-Way Dispatch Selector:** Industrial button controls for rapid manual/automatic route selection.
- **Safety Priority Logic:** $\text{Flood Safety} > \text{Ground Condition} > \text{Operator Selection}$.
  - During flood conditions, groundwater recharge is **BLOCKED** and diverted to FloodShield bypass to ensure environmental safety.

### 3. PostgreSQL Database Integration (Supabase)
- **Authoritative Persistence:** Real-time state synchronization backed by Supabase PostgreSQL transaction pooler.
- **Persistent Tables:**
  - `system_state`: Stores operational status, stage, route, valves, and health metrics.
  - `sensor_readings`: Periodic telemetry readings (level, flow, moisture, temperature).
  - `routing_events`: Complete audit log of M3 routing decisions.
  - `system_alerts`: SCADA alarm management with severity ratings.
  - `system_history`: Operational stage progression timeline.

### 4. REST API Backend Gateway
- **Node.js & Express 5 API:** Centralized gateway serving REST endpoints and managing connection-pooled SQL queries over SSL.
- **Graceful Fallback:** Supports offline and local demo modes if external network is unavailable.

---

## 🛠️ Technology Stack
- **Frontend:** HTML5, Vanilla CSS3 (Custom SCADA Design System), JavaScript (ES6+ Modular Architecture).
- **Backend:** Node.js, Express 5, CORS, Dotenv.
- **Database:** Supabase PostgreSQL (`pg` Connection Pooling with SSL).
- **Charts & Visualization:** Canvas 2D API for real-time telemetry graphs.

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/kamalesh151207/FLOWSHIELD-GREYLOOP.git
cd FLOWSHIELD-GREYLOOP
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Supabase PostgreSQL connection string:
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
PORT=8080
```

### 4. Start the Application
```bash
npm start
```
Open your browser and navigate to: `http://localhost:8080`

---

## 📡 REST API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check for server and PostgreSQL connectivity |
| `/api/system/state` | `GET` | Retrieves current authoritative system state |
| `/api/system/state` | `PATCH` | Updates system state attributes |
| `/api/routing` | `GET` | Retrieves active M3 route and recent routing history |
| `/api/routing` | `POST` | Dispatches route selection with server-side safety checks |
| `/api/sensors/latest`| `GET` | Fetches latest sensor telemetry snapshot |
| `/api/sensors/history`| `GET` | Retrieves rolling sensor history for charts |
| `/api/sensors` | `POST` | Records periodic sensor readings |
| `/api/alerts` | `GET` | Fetches active and historical alerts |
| `/api/alerts` | `POST` | Creates a new system alarm |
| `/api/alerts/:id` | `PATCH` | Resolves an active alarm |
| `/api/history` | `GET` | Retrieves persisted system operational history |

---

## 📂 Project Structure
```
FLOWSHIELD-GREYLOOP/
├── index.html                  # Main SCADA Dashboard Entry Point
├── package.json                # Project Dependencies & Scripts
├── package-lock.json
├── .env.example                # Environment Variable Template
├── .gitignore                  # Git Ignore Rules
├── README.md                   # Documentation
├── css/
│   ├── styles.css              # Core Design System & Tokens
│   ├── dashboard.css           # SCADA Component Styles & Layout
│   └── responsive.css          # Responsive Breakpoints & Adaptations
├── js/
│   ├── api.js                  # Frontend REST API Service Gateway
│   ├── app.js                  # Application Controller & Event Orchestrator
│   ├── dashboard.js            # SCADA UI Renderer & Component Manager
│   ├── simulationService.js    # Simulation Engine & Database Sync
│   ├── systemState.js          # Central Reactive State Store
│   ├── sensorService.js        # Telemetry & Micro-Fluctuations Model
│   ├── alertService.js         # Alarm Management System
│   ├── chartManager.js         # Canvas Real-time Graph Visualizer
│   └── schematicRenderer.js    # Dynamic SVG Hydraulic Flow Renderer
├── server/
│   ├── server.js               # Express Backend Server
│   ├── db.js                   # PostgreSQL Connection Pool & Migrator
│   └── routes/
│       ├── system.js           # Health & State Endpoints
│       ├── routing.js          # M3 Routing Dispatch Endpoints
│       ├── sensors.js          # Telemetry Endpoints
│       ├── alerts.js           # Alert Endpoints
│       └── history.js          # History Endpoints
├── database/
│   └── schema.sql              # Supabase PostgreSQL Table Definitions
└── assets/
    ├── icons/
    └── images/
```

---

## 🔒 Security & Privacy Note
- The `DATABASE_URL` is kept strictly on the backend server inside `.env`.
- Database credentials and connection strings are **never** exposed to client-side code, HTML, CSS, or Git commits.
- All SQL queries use parameterized queries to prevent SQL injection.

---

## 📜 License
This project is licensed under the ISC License.
