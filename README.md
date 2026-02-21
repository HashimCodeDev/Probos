# Probos

**Sensor Trust Verification Engine for Precision Agriculture**

---

## Problem Statement

Large-scale precision agriculture deployments rely on networks of thousands of soil sensors to measure critical parameters like moisture, temperature, and electrical conductivity. These measurements drive automated irrigation and fertilization systems that optimize resource usage and crop yields.

However, sensor networks suffer from **silent failures**:
- Sensors can become stuck, reporting unchanged values despite environmental changes
- Physical damage or calibration drift can cause sudden spikes or anomalous readings
- Faulty sensors distort the data fed into automation systems
- **Even a 5% sensor failure rate** can lead to incorrect irrigation decisions, causing water waste, nutrient imbalance, and reduced crop productivity

The fundamental challenge is that **automation systems trust all sensor data equally**, lacking the ability to distinguish reliable readings from faulty ones.

---

## Solution Overview

**Probos** introduces a **Trust Layer** between raw sensor data and decision-making systems. Rather than blindly trusting all sensors, Probos continuously validates sensor behavior and assigns a dynamic **Trust Score** to each device.

### Key Innovation

Probos acts as a **reliability firewall**:
1. Sensors send readings → Probos ingests and analyzes them
2. Trust Engine evaluates each sensor's behavior using statistical methods
3. Faulty sensors are flagged and isolated **before** they influence decisions
4. Maintenance tickets are automatically generated for anomalous sensors
5. Only trusted sensor data flows to automation systems

This approach prevents faulty sensors from corrupting irrigation decisions, reducing resource waste and improving operational reliability.

---

## Core Modules Explanation

### 1. Sensor Registry Module

**Purpose**: Centralized management of sensor metadata and network topology.

**Functionality**:
- Registers new sensors with unique IDs, zone assignments, and geographic coordinates
- Maintains sensor metadata (type, installation date, location)
- Initializes each sensor with a baseline Trust Score of 100
- Provides lookup capabilities for sensor information retrieval

**Why It Matters**: Knowing which sensors belong to which zones enables cross-sensor validation and zone-level anomaly detection.

---

### 2. Data Ingestion Module

**Purpose**: Accept and store real-time sensor readings.

**Functionality**:
- Receives sensor readings via REST API (moisture, temperature, EC)
- Timestamps each reading for temporal analysis
- Stores readings in the database for historical tracking
- Triggers Trust Engine evaluation after each new reading

**Design Choice**: Immediate trust evaluation ensures rapid detection of sensor failures, preventing bad data from accumulating.

---

### 3. Trust Engine Module

**Purpose**: Core intelligence that evaluates sensor reliability.

**Evaluation Criteria**:

#### a) **Static Detection (Low Variance)**
- Calculates variance across the last 50 readings
- If variance < 0.01, the sensor is likely stuck
- **Penalty**: -15 points
- **Reason**: Healthy sensors show natural fluctuation as soil conditions change

#### b) **Spike Detection (Sudden Jumps)**
- Compares current reading to previous reading
- If percentage change > 30%, flags a spike
- **Penalty**: -20 points
- **Reason**: Natural changes in soil moisture are gradual; sudden jumps indicate malfunction

#### c) **Cross-Sensor Anomaly (Zone Deviation)**
- Compares sensor reading to zone mean ± 2 standard deviations
- If the reading falls outside this range, it's anomalous
- **Penalty**: -25 points
- **Reason**: Sensors in the same zone should show similar trends; outliers are suspicious

**Trust Score Range**: 0-100 (clamped)

**Status Thresholds**:
- **> 80**: Healthy (green)
- **60-80**: Warning (yellow)
- **< 60**: Anomalous (red)

**Auto-Ticket Generation**: When a sensor becomes Anomalous, a maintenance ticket is automatically created with detailed issue description.

---

### 4. Maintenance Automation Module

**Purpose**: Manage maintenance workflows for faulty sensors.

**Functionality**:
- Auto-generates tickets when sensors enter Anomalous state
- Prevents duplicate tickets for the same sensor
- Categorizes issues by severity (Low, Medium, High)
- Tracks ticket lifecycle: Open → InProgress → Resolved
- Provides filtering and querying capabilities for maintenance teams

**Value**: Converts anomaly detection into actionable maintenance tasks, closing the loop between detection and repair.

---

### 5. Dashboard & Visualization Module

**Purpose**: Real-time monitoring and system health overview.

**Features**:
- **Summary Cards**: Total sensors, Healthy/Warning/Anomalous counts
- **Sensor Table**: Live view of all sensors with current trust scores and readings
- **Trust Score Distribution Chart**: Visual breakdown of sensor health across the network
- **Maintenance Page**: Centralized list of all open, in-progress, and resolved tickets

**Design Philosophy**: At-a-glance visibility into system health enables proactive management and rapid issue identification.

---

## Architecture Overview

```
┌─────────────┐
│   Sensors   │  (Soil moisture, temperature, EC sensors)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Backend API    │  (Express.js REST endpoints)
│  /api/readings  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Trust Engine   │  (Evaluates sensor behavior)
│  - Low variance │
│  - Spike detect │
│  - Zone anomaly │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Database      │  (PostgreSQL + Prisma ORM)
│  - Sensors      │
│  - Readings     │
│  - TrustScores  │
│  - Tickets      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Dashboard     │  (Next.js frontend)
│  - Live metrics │
│  - Trust charts │
│  - Tickets view │
└─────────────────┘
```

**Data Flow**:
1. Sensors push readings to `/api/readings` endpoint
2. Backend stores reading in database
3. Trust Engine evaluates sensor using last 50 readings
4. New trust score is calculated and stored
5. If anomalous, maintenance ticket is generated
6. Frontend polls `/api/dashboard/summary` and `/api/sensors` for updates
7. Operators view sensor health and maintenance tasks in real-time

---

## Trust Score Logic

### Initialization
- Every sensor starts with a Trust Score of **100**

### Penalty System
- **Low Variance**: -15 (sensor stuck)
- **Spike Detected**: -20 (sudden anomalous jump)
- **Zone Anomaly**: -25 (deviates from zone peers)

### Score Clamping
- Final score is clamped between **0 and 100**
- Multiple penalties can stack (e.g., a sensor with all three issues: 100 - 15 - 20 - 25 = 40)

### Status Mapping
```
Score > 80  → Healthy    (Green)
Score 60-80 → Warning    (Yellow)
Score < 60  → Anomalous  (Red, auto-generates ticket)
```

### Re-Evaluation
- Trust score is recalculated **on every new reading**
- Sensors can recover if behavior normalizes
- Historical trust scores are preserved for trend analysis

---

## How to Run

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **pnpm** (or npm)

---

### Backend Setup

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure database**:
   - Edit `.env` file with your PostgreSQL connection string:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/probos"
     ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

6. **Start the backend server**:
   ```bash
   npm run dev
   ```

   The API will run on `http://localhost:5000`

---

### Frontend Setup

1. **Navigate to frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The dashboard will be available at `http://localhost:3000`

---

### Testing the System

1. **Register a sensor**:
   ```bash
   curl -X POST http://localhost:5000/api/sensors \
     -H "Content-Type: application/json" \
     -d '{
       "sensorId": "SENSOR-001",
       "zone": "Field-A",
       "type": "soil_moisture",
       "latitude": 37.7749,
       "longitude": -122.4194
     }'
   ```

2. **Send sensor readings**:
   ```bash
   curl -X POST http://localhost:5000/api/readings \
     -H "Content-Type: application/json" \
     -d '{
       "sensorId": "SENSOR-001",
       "moisture": 45.2,
       "temperature": 22.5,
       "ec": 1.2
     }'
   ```

3. **View dashboard**: Open `http://localhost:3000` to see sensor health and trust scores

4. **Check maintenance tickets**: Navigate to `http://localhost:3000/maintenance`

---

## API Endpoints

### Sensors
- `POST /api/sensors` - Register a new sensor
- `GET /api/sensors` - List all sensors with latest trust scores
- `GET /api/sensors/:id` - Get sensor details

### Readings
- `POST /api/readings` - Ingest a single sensor reading
- `POST /api/readings/batch` - Batch ingest multiple readings

### Dashboard
- `GET /api/dashboard/summary` - Get system overview (sensor counts, ticket stats)
- `GET /api/dashboard/zones` - Get zone-level statistics
- `GET /api/dashboard/activity` - Get recent activity feed

### Maintenance
- `GET /api/tickets` - List all maintenance tickets
- `GET /api/tickets?status=Open` - Filter tickets by status
- `PATCH /api/tickets/:id` - Update ticket status

---

## Project Structure

```
Probos/
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── sensorRegistry.js    # Sensor management
│   │   │   ├── dataIngestion.js     # Reading intake
│   │   │   ├── trustEngine.js       # Core trust logic
│   │   │   ├── maintenance.js       # Ticket management
│   │   │   └── dashboard.js         # Summary stats
│   │   └── server.js                # Express app
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   └── Navigation.tsx       # Nav bar
│   │   ├── maintenance/
│   │   │   └── page.tsx             # Maintenance page
│   │   ├── page.tsx                 # Dashboard page
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css
│   ├── package.json
│   └── .env.local
│
└── README.md
```

---

## Future Scope

### 1. Machine Learning-Based Anomaly Detection
- **Current**: Rule-based statistical thresholds
- **Future**: Train ML models on historical sensor data to detect subtle drift patterns
- **Benefit**: Catch complex failures that simple variance/spike checks miss

### 2. Predictive Maintenance
- **Current**: Reactive ticket generation when sensors fail
- **Future**: Predict sensor failures before they occur based on degradation trends
- **Benefit**: Preventive replacement instead of reactive repairs

### 3. Integration with Real Irrigation Controllers
- **Current**: Standalone trust verification system
- **Future**: Direct API integration with irrigation controllers (e.g., Netafim, Jain)
- **Benefit**: Automatically exclude untrusted sensors from irrigation decisions

### 4. Weather-Based Validation Layer
- **Current**: Cross-sensor zone validation only
- **Future**: Compare sensor readings against local weather data (rainfall, evapotranspiration)
- **Benefit**: Detect sensors that contradict known weather events (e.g., no moisture increase after heavy rain)

### 5. Mobile App for Field Technicians
- **Current**: Web dashboard only
- **Future**: Native mobile app with offline ticket management and GPS-based sensor navigation
- **Benefit**: Enable technicians to resolve issues in areas with poor connectivity

### 6. Multi-Crop Zone Calibration
- **Current**: Single variance/threshold configuration
- **Future**: Crop-specific trust parameters (e.g., rice paddies vs. orchards have different moisture patterns)
- **Benefit**: Reduce false positives in heterogeneous farming environments

### 7. Blockchain-Based Sensor Audit Trail
- **Current**: Database-stored trust scores
- **Future**: Immutable ledger of sensor trust history for compliance and insurance claims
- **Benefit**: Prove sensor reliability to auditors and stakeholders

---

## Technology Choices

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| Backend | Node.js + Express | Fast prototyping, large ecosystem, non-blocking I/O for sensor streams |
| Database | PostgreSQL | ACID compliance for critical trust data, strong JSON support |
| ORM | Prisma | Type-safe database access, excellent migration tooling |
| Frontend | Next.js (App Router) | React framework with built-in routing, SSR capabilities |
| Styling | Tailwind CSS | Rapid UI development, utility-first approach |
| Charts | Recharts | React-native charting library, easy integration |

---

## Key Insights

1. **Trust is Dynamic**: Sensors don't fail permanently; they can recover. Continuous re-evaluation allows sensors to regain trust.

2. **Zone Context Matters**: A sensor reading that's anomalous in isolation might be normal for its zone. Cross-sensor comparison is critical.

3. **Prevention > Reaction**: Catching faulty sensors early prevents cascading errors in automation systems.

4. **Automation Needs Verification**: The shift from manual to automated agriculture demands robust data validation layers like Probos.

---

## License

MIT License - See LICENSE file for details

---

## Contributors

Built during a hackathon to demonstrate real-world IoT trust verification concepts.

---

## Contact

For questions or collaboration opportunities, please open an issue in this repository.

---

**Probos**: Because in precision agriculture, data you can trust is the foundation of decisions that matter.
