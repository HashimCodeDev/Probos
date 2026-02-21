# Quick Start Guide - Probos

Get Probos running in 5 minutes!

## Prerequisites

Make sure you have installed:
- Node.js (v18+)
- PostgreSQL (v14+)
- pnpm or npm

## Step 1: Setup PostgreSQL Database

Create a new database:
```bash
createdb probos
```

Or using psql:
```bash
psql
CREATE DATABASE probos;
\q
```

## Step 2: Configure Backend

```bash
cd backend

# Install dependencies
npm install

# Update .env file with your PostgreSQL credentials
# Edit backend/.env:
# DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/probos"

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

## Step 3: Start Backend Server

```bash
# From backend/ directory
npm run dev
```

Backend will run on `http://localhost:5000`

## Step 4: Seed Sample Data (Optional)

Open a new terminal:
```bash
cd backend
npm run seed
```

This will create 15 sample sensors and generate test readings.

## Step 5: Setup Frontend

Open a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## Step 6: Access Dashboard

Open your browser:
- **Dashboard**: http://localhost:3000
- **Maintenance**: http://localhost:3000/maintenance
- **API Health**: http://localhost:5000/api/health

## Testing the API

### Register a sensor:
```bash
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "sensorId": "TEST-001",
    "zone": "Field-A",
    "type": "soil_moisture",
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

### Send a reading:
```bash
curl -X POST http://localhost:5000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "sensorId": "TEST-001",
    "moisture": 45.2,
    "temperature": 22.5,
    "ec": 1.2
  }'
```

### View all sensors:
```bash
curl http://localhost:5000/api/sensors
```

### View dashboard summary:
```bash
curl http://localhost:5000/api/dashboard/summary
```

## Troubleshooting

### Database connection error
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `backend/.env`
- Ensure database exists: `psql -l`

### Prisma errors
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

### Port already in use
- Backend: Change PORT in `backend/.env`
- Frontend: Use `npm run dev -- -p 3001`

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check NEXT_PUBLIC_API_URL in `frontend/.env.local`

## Project Structure

```
Probos/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── modules/  # Business logic modules
│   │   └── server.js # Express server
│   ├── prisma/       # Database schema
│   └── seed.js       # Sample data generator
│
└── frontend/         # Next.js dashboard
    └── app/
        ├── page.tsx              # Dashboard
        └── maintenance/page.tsx  # Tickets
```

## Next Steps

1. Explore the dashboard at http://localhost:3000
2. Send multiple readings to see trust scores change
3. Create anomalous readings to trigger maintenance tickets
4. Check the comprehensive README.md for detailed documentation

## Support

For detailed documentation, see [README.md](README.md)

---

**Happy Hacking! 🚀**
