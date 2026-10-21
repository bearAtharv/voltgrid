# VoltGrid

VoltGrid is an EV charging station and infrastructure management system built with PostgreSQL 16, Node.js (Express), and React (Vite, TypeScript).

The project focuses on database design, featuring an interactive SQL explorer, live query stream, automated triggers, stored procedures, and concurrency control.

## Database Overview

The system runs on PostgreSQL (`voltgrid_db`) and consists of 11 relational tables:

- **Identity & Vehicles:** `user_account`, `driver_profile`, `technician_profile`, `ev_vehicle`
- **Infrastructure:** `charging_station`, `charging_bay`, `connector_port`
- **Operations & Billing:** `tariff_plan`, `charging_reservation`, `maintenance_ticket`, `audit_station_telemetry_log`

Key database features:
- **Concurrency Control:** `EXCLUDE USING gist` constraint on timestamp ranges to prevent double-booking.
- **Triggers:** Automatic synchronization of bay status on maintenance tickets and reservation state transitions.
- **Procedures:** Atomic booking, cancellation, and session completion with pessimistic row locking (`SELECT FOR UPDATE`).
- **In-App SQL Lab:** Live query stream, schema viewer, and interactive query runner.

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker Desktop)

## Running with Docker (Recommended)

Start the database, API server, and frontend client in one command:

```bash
docker compose up --build -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Database: localhost:5432 (User: `postgres`, Password: `postgrespassword`, DB: `voltgrid_db`)

To stop:
```bash
docker compose down
```

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
Create `server/.env` (see `server/.env.example`):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voltgrid_db
DB_USER=postgres
DB_PASSWORD=postgrespassword
JWT_SECRET=super_secret_voltgrid_jwt_key_2026_change_in_prod
```

3. Initialize and seed the database:
```bash
npm run db:init --workspace=server
```

4. Start development servers:
```bash
npm run dev
```

- Frontend runs at http://localhost:5173
- Backend runs at http://localhost:5000

## Running Tests

```bash
npm test --workspace=server
```
