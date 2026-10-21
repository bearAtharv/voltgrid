# ⚡ VoltGrid: Smart EV Charging & Infrastructure Management System

> **A Production-Grade DBMS & Full-Stack Application for University Coursework.**
> Engineered with **PostgreSQL 16**, **BCNF Normalization**, **GIST Range Exclusion Constraints**, **Pessimistic Row Locking (`SELECT FOR UPDATE`)**, **Recursive CTEs**, **Window Functions**, and a **Real-Time React + TypeScript UI**.

---

## 🎯 3-to-5 Minute Viva / Presentation Cheat Sheet

Use this exact walkthrough during your professor review to hit every major database rubric point in under 5 minutes:

```
+--------------------------------------------------------------------------------------------------+
| MINUTE 1: Domain & Conceptual Design (EER Diagram & BCNF Normalization)                         |
| • Open the ER diagram in the documentation.                                                     |
| • Explain Generalization/Specialization: user_account -> driver_profile vs technician_profile   |
| • Explain Weak Entity: charging_bay identified by (station_id, bay_number)                       |
| • Explain Associative Entity: charging_reservation coordinating driver, vehicle, bay & tariff   |
| • State that all 10 tables satisfy BCNF with formal FD proofs eliminating all 3 anomalies.      |
+--------------------------------------------------------------------------------------------------+
| MINUTE 2: Physical Database Engine & Defense-in-Depth Constraints                                |
| • Show `database/01_schema.sql`.                                                                |
| • Point out `EXCLUDE USING gist (bay_id WITH =, tstzrange(...) WITH &&)`.                        |
| • Explain why GIST exclusion makes double-booking structurally impossible at the engine level.  |
| • Highlight physical connector compatibility matching (NACS, CCS2, CHAdeMO).                   |
+--------------------------------------------------------------------------------------------------+
| MINUTE 3: Multi-Slot Day Scheduling & Concurrency Control                                        |
| • Open "Stations" tab and click "Book Slot" on an available bay.                                 |
| • Demonstrate the Interactive Date (Today/Tomorrow) and 2-Hour Time Slot Matrix.                 |
| • Explain `SELECT ... FOR UPDATE` with `SET LOCAL lock_timeout = '3s'` in `sp_book_charging_bay_atomic`.|
| • Point out real-world Indian pricing (₹4.50 to ₹12.50/kWh -> ₹109 to ₹350 for a standard charge).|
+--------------------------------------------------------------------------------------------------+
| MINUTE 4: Role-Based Access Control (RBAC) & Automated Triggers                                   |
| • Switch personas via top-right dropdown: Aarav (Driver), Rajesh (Technician), Dr. Sunita (Admin).|
| • As Driver: show privacy-first "My Activity" and "Eco Impact" (fuel savings vs petrol @ ₹108/L). |
| • Switch to Rajesh (Technician): show Maintenance Workbench with claim/resolve actions.          |
| • Demonstrate trigger `trg_sync_bay_status_ticket` automatically restoring bay status.          |
+--------------------------------------------------------------------------------------------------+
| MINUTE 5: OLAP Analytics & Live SQL Terminal Inspector                                           |
| • Switch to Dr. Sunita (Admin) and open "Platform OLAP" tab.                                     |
| • Showcase the Driver Leaderboard powered by `DENSE_RANK()` and `PERCENT_RANK()`.                |
| • Click the floating "[ >_ SQL Inspector ]" pill in the bottom right corner.                    |
| • Show the Live Query Stream auto-scrolling with millisecond execution durations and params.     |
| • Open the "Interactive SQL Console" tab and run custom queries or preset analytical views.     |
+--------------------------------------------------------------------------------------------------+
```

---

## 💻 Live SQL Terminal & Query Inspector (Course Requirement)

VoltGrid features an integrated **Real-Time SQL Inspector & Terminal Console** built directly into the UI:
* **Live Query Stream:** Intercepts and broadcasts every SQL statement executed across the application over WebSockets with timestamp, millisecond execution latency, row counts, and status (`SUCCESS` / `ERROR`).
* **Interactive SQL Console (`voltgrid_db=> `):** In-browser query editor allowing professors to execute arbitrary queries (`SELECT`, `WITH`, `EXPLAIN`, `SHOW`) with tabular results rendering.
* **Security Sandbox:** Enforces a 3-second statement timeout (`SET LOCAL statement_timeout = '3000'`) and blocks destructive commands (`DROP`, `TRUNCATE`, `ALTER SYSTEM`) to ensure database safety.
* **Preset Queries:** Quick 1-click execution for *Available Bays*, *Driver Leaderboard*, *Feeder Hierarchy Tree*, *Active Tariffs*, and *Audit Telemetry*.

---

## 🏗️ Relational Architecture & Entity Summary

| Table Name | Entity Class | Primary Key | Key Constraints & Characteristics |
|---|---|---|---|
| `user_account` | Supertype | `account_id (UUID)` | Generalization base; email format regex check; unique email. |
| `driver_profile` | Subtype | `account_id (UUID)` | 1:1 total specialization; unique driver license. |
| `technician_profile` | Subtype | `account_id (UUID)` | 1:1 total specialization; employee code; duty status. |
| `ev_vehicle` | Strong Entity | `vehicle_id (UUID)` | Unique VIN & plate; connector ENUM; FK to `driver_profile`. |
| `charging_station` | Strong Entity | `station_id (UUID)` | Self-referencing FK `parent_grid_node_id` for recursive grid trees. |
| `charging_bay` | **Weak Entity** | `bay_id (UUID)` | Composite UK `(station_id, bay_number)`; `ON DELETE CASCADE`. |
| `connector_port` | Component | `connector_id (UUID)` | Plug type ENUM (`CCS2`, `NACS`, `CHAdeMO`, `TYPE2`); max kW. |
| `tariff_plan` | Strong / Lookup | `tariff_id (UUID)` | Base price/kWh; peak multiplier; peak time window. |
| `charging_reservation` | **Associative Entity** | `reservation_id (UUID)` | **`EXCLUDE USING gist`** range overlap constraint; SoC checks. |
| `maintenance_ticket` | Incident Entity | `ticket_id (UUID)` | Severity ENUM; links bay, driver reporter, and technician. |
| `audit_station_telemetry_log`| Telemetry Entity | `audit_id (UUID)` | JSONB metric snapshots populated by lifecycle triggers. |

---

## 🚀 Quickstart: Running the Application Locally

### Option A: One-Command Docker Orchestration (Recommended)

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running, then execute from the root directory:

```bash
# Spin up PostgreSQL 16, Express API, and React Frontend
docker compose up --build -d
```

* **Frontend UI:** Open [http://localhost:5173](http://localhost:5173) in your browser.
* **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **PostgreSQL:** `localhost:5432` (User: `postgres`, Password: `postgrespassword`, DB: `voltgrid_db`).

---

### Option B: Native Local Development (Node.js & PostgreSQL)

#### 1. Setup PostgreSQL Database
Ensure PostgreSQL 16 is installed and running locally, then create the database:
```sql
CREATE DATABASE voltgrid_db;
```

#### 2. Run Database SQL Scripts
Execute the SQL files in order using `psql` or `pgAdmin`:
```bash
psql -U postgres -d voltgrid_db -f database/01_schema.sql
psql -U postgres -d voltgrid_db -f database/02_triggers.sql
psql -U postgres -d voltgrid_db -f database/03_stored_procedures.sql
psql -U postgres -d voltgrid_db -f database/04_analytical_queries.sql
psql -U postgres -d voltgrid_db -f database/05_seed_data.sql
```

#### 3. Start Backend Server
```bash
cd server
npm install
npm run dev
```

#### 4. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🧪 Running Concurrency & Constraint Tests

To execute the automated SQL verification script proving double-booking prevention, connector validation, and analytical views:

```bash
psql -U postgres -d voltgrid_db -f database/06_concurrency_test.sql
```

---

## ☁️ AWS Free Tier Deployment Guide

### Architecture on AWS Free Tier
* **Compute:** 1x EC2 `t2.micro` or `t3.micro` instance (Ubuntu 24.04 LTS — 750 free hours/month).
* **Containers:** Docker Compose running PostgreSQL 16 + Express API + React Client.
* **Reverse Proxy & SSL:** Nginx + Let's Encrypt (Certbot) for HTTPS.

### Step-by-Step Deployment:

1. **Launch EC2 Instance:**
   * AMI: `Ubuntu Server 24.04 LTS (HVM), SSD Volume Type`
   * Instance Type: `t2.micro` (or `t3.micro` where eligible)
   * Security Group: Allow Inbound **SSH (22)**, **HTTP (80)**, and **HTTPS (443)**.

2. **Connect and Install Docker:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-public-ip

   # Update and install Docker + Docker Compose
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y docker.io docker-compose git
   sudo usermod -aG docker ubuntu
   newgrp docker
   ```

3. **Clone & Launch VoltGrid:**
   ```bash
   git clone <your-voltgrid-repo-url> voltgrid
   cd voltgrid
   docker compose up -d --build
   ```

4. **Setup Nginx Reverse Proxy (Port 80/443 -> Port 5173 & 5000):**
   ```nginx
   # /etc/nginx/sites-available/voltgrid
   server {
       listen 80;
       server_name your-domain-or-ip;

       location / {
           proxy_pass http://localhost:5173;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }

       location /socket.io {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
       }
   }
   ```
   Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/voltgrid /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
