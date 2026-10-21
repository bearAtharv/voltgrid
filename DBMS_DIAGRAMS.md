# VoltGrid: Complete DBMS Architecture & ER Diagrams Pack

This document contains all database diagrams required for your DBMS project report and viva presentation:
1. **Complete Entity-Relationship (ER) Diagram** (Crow's Foot Notation — All 11 Tables)
2. **Conceptual EER Hierarchy Diagram** (Supertype/Subtype Inheritance, Weak Entities, and Recursive Relationship)
3. **Foreign Key Referential Integrity & `ON DELETE` Behavior Diagram** (`CASCADE` vs `RESTRICT` vs `SET NULL`)
4. **Database Triggers & Stored Procedure Execution Sequence Diagram**
5. **Views & Materialized View Data Lineage Diagram**

---

## 1. Complete Entity-Relationship (ER) Diagram (All 11 Tables)

```mermaid
erDiagram
    USER_ACCOUNT ||--o| DRIVER_PROFILE : "1:1 Subtype (ON DELETE CASCADE)"
    USER_ACCOUNT ||--o| TECHNICIAN_PROFILE : "1:1 Subtype (ON DELETE CASCADE)"
    DRIVER_PROFILE ||--o{ EV_VEHICLE : "1:N Owns (ON DELETE CASCADE)"
    DRIVER_PROFILE ||--o{ CHARGING_RESERVATION : "1:N Books (ON DELETE RESTRICT)"
    DRIVER_PROFILE ||--o{ MAINTENANCE_TICKET : "1:N Reports (ON DELETE SET NULL)"
    TECHNICIAN_PROFILE ||--o{ MAINTENANCE_TICKET : "1:N Resolves (ON DELETE SET NULL)"
    EV_VEHICLE ||--o{ CHARGING_RESERVATION : "1:N Charged In (ON DELETE RESTRICT)"
    CHARGING_STATION ||--o{ CHARGING_STATION : "1:N Parent Grid Feeder (ON DELETE SET NULL)"
    CHARGING_STATION ||--|{ CHARGING_BAY : "1:N Houses Weak Entity (ON DELETE CASCADE)"
    CHARGING_BAY ||--|{ CONNECTOR_PORT : "1:N Equips (ON DELETE CASCADE)"
    CHARGING_BAY ||--o{ CHARGING_RESERVATION : "1:N Allocated To (ON DELETE RESTRICT)"
    CHARGING_BAY ||--o{ MAINTENANCE_TICKET : "1:N Serviced Under (ON DELETE CASCADE)"
    TARIFF_PLAN ||--o{ CHARGING_RESERVATION : "1:N Prices (ON DELETE RESTRICT)"
    CHARGING_STATION ||--o{ AUDIT_STATION_TELEMETRY_LOG : "1:N Logs (ON DELETE CASCADE)"
    CHARGING_BAY ||--o{ AUDIT_STATION_TELEMETRY_LOG : "1:N Logs (ON DELETE CASCADE)"
    CHARGING_RESERVATION ||--o{ AUDIT_STATION_TELEMETRY_LOG : "1:NSnapshots (ON DELETE SET NULL)"

    USER_ACCOUNT {
        UUID account_id PK
        VARCHAR email UK "NOT NULL"
        VARCHAR password_hash "NOT NULL"
        VARCHAR first_name "NOT NULL"
        VARCHAR last_name "NOT NULL"
        VARCHAR phone_number "NOT NULL"
        ENUM user_role "DRIVER | TECHNICIAN | ADMIN"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    DRIVER_PROFILE {
        UUID account_id PK,FK "References user_account(account_id)"
        VARCHAR driver_license_num UK "NOT NULL"
        VARCHAR payment_customer_token
        VARCHAR loyalty_tier "STANDARD | SILVER | GOLD | PLATINUM"
    }

    TECHNICIAN_PROFILE {
        UUID account_id PK,FK "References user_account(account_id)"
        VARCHAR employee_code UK "NOT NULL"
        VARCHAR certification_grade "NOT NULL"
        VARCHAR operational_zone "NOT NULL"
        BOOLEAN is_on_duty "DEFAULT FALSE"
    }

    EV_VEHICLE {
        UUID vehicle_id PK
        UUID driver_id FK "References driver_profile(account_id)"
        VARCHAR vin_number UK "17-char VIN"
        VARCHAR license_plate UK "NOT NULL"
        VARCHAR make "NOT NULL"
        VARCHAR model "NOT NULL"
        NUMERIC battery_capacity_kwh "CHECK > 0"
        NUMERIC max_charge_rate_kw "CHECK > 0"
        ENUM connector_type "CCS2 | TYPE2 | CHAdeMO | NACS"
    }

    CHARGING_STATION {
        UUID station_id PK
        VARCHAR station_name "NOT NULL"
        UUID parent_grid_node_id FK "Self-FK to charging_station(station_id)"
        NUMERIC latitude UK "Composite UK (lat, lng)"
        NUMERIC longitude UK "Composite UK (lat, lng)"
        VARCHAR street_address "NOT NULL"
        VARCHAR city "NOT NULL"
        NUMERIC max_grid_capacity_kw "CHECK > 0"
        VARCHAR operational_status "ACTIVE | OFFLINE"
    }

    CHARGING_BAY {
        UUID bay_id PK
        UUID station_id FK "References charging_station(station_id)"
        INT bay_number "Composite UK (station_id, bay_number)"
        ENUM bay_status "AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE"
        BOOLEAN supports_fast_charge
    }

    CONNECTOR_PORT {
        UUID connector_id PK
        UUID bay_id FK "References charging_bay(bay_id)"
        ENUM connector_type "CCS2 | TYPE2 | CHAdeMO | NACS"
        NUMERIC max_power_kw "CHECK > 0"
        VARCHAR port_status "FUNCTIONAL | FAULTY"
    }

    TARIFF_PLAN {
        UUID tariff_id PK
        VARCHAR plan_name UK "NOT NULL"
        NUMERIC base_price_per_kwh "CHECK >= 0"
        NUMERIC peak_multiplier "CHECK >= 1.00"
        NUMERIC idle_fee_per_minute "CHECK >= 0"
        TIME peak_start_time
        TIME peak_end_time
    }

    CHARGING_RESERVATION {
        UUID reservation_id PK
        UUID driver_id FK "References driver_profile(account_id)"
        UUID vehicle_id FK "References ev_vehicle(vehicle_id)"
        UUID bay_id FK "References charging_bay(bay_id)"
        UUID tariff_id FK "References tariff_plan(tariff_id)"
        TIMESTAMPTZ start_time "GiST Exclusion Range Start"
        TIMESTAMPTZ end_time "GiST Exclusion Range End"
        NUMERIC initial_soc_percent "0 to 100"
        NUMERIC target_soc_percent "CHECK >= initial_soc"
        NUMERIC energy_delivered_kwh
        NUMERIC total_amount_due
        ENUM reservation_status "CONFIRMED | ACTIVE | COMPLETED | CANCELLED"
    }

    MAINTENANCE_TICKET {
        UUID ticket_id PK
        UUID bay_id FK "References charging_bay(bay_id)"
        UUID reported_by_driver_id FK "References driver_profile(account_id)"
        UUID assigned_technician_id FK "References technician_profile(account_id)"
        VARCHAR fault_category "NOT NULL"
        ENUM severity_level "LOW | MEDIUM | HIGH | CRITICAL"
        ENUM ticket_status "OPEN | IN_PROGRESS | RESOLVED | CLOSED"
        TEXT description
        TIMESTAMPTZ reported_at
        TIMESTAMPTZ resolved_at
    }

    AUDIT_STATION_TELEMETRY_LOG {
        UUID audit_id PK
        UUID station_id FK "References charging_station(station_id)"
        UUID bay_id FK "References charging_bay(bay_id)"
        UUID reservation_id FK "References charging_reservation(reservation_id)"
        VARCHAR event_type "NOT NULL"
        JSONB metric_snapshot "Immutable JSONB payload"
        TIMESTAMPTZ created_at
    }
```

---

## 2. EER Conceptual Diagram (Inheritance, Weak Entities & Recursive Hierarchy)

This diagram highlights the **four core relational modeling patterns** used in the schema:
1. **ISA Specialization (Supertype / Subtype Inheritance):** `user_account` $\rightarrow$ `driver_profile` and `technician_profile` (shared Primary Key `account_id`).
2. **Recursive Self-Referencing Relationship:** `charging_station.parent_grid_node_id` $\rightarrow$ `charging_station.station_id` (models regional substations feeding child charging hubs).
3. **Weak / Dependent Entity Chain:** `charging_station` $\rightarrow$ `charging_bay` (identified by `station_id + bay_number`) $\rightarrow$ `connector_port`.
4. **4-Way Associative Entity:** `charging_reservation` connecting `driver_profile`, `ev_vehicle`, `charging_bay`, and `tariff_plan`.

```mermaid
flowchart TD
    subgraph ISA["1. Supertype / Subtype Inheritance (1:1 Shared PK)"]
        UA["user_account<br/>(PK: account_id)"]
        DP["driver_profile<br/>(PK, FK: account_id)"]
        TP["technician_profile<br/>(PK, FK: account_id)"]
        UA -->|"ISA (user_role = DRIVER)"| DP
        UA -->|"ISA (user_role = TECHNICIAN)"| TP
    end

    subgraph INFRA["2. Recursive Hierarchy & Weak Entities"]
        CS["charging_station<br/>(PK: station_id)<br/>(Self-FK: parent_grid_node_id)"]
        CB["charging_bay [Weak Entity]<br/>(PK: bay_id | UK: station_id + bay_number)"]
        CP["connector_port<br/>(PK: connector_id | FK: bay_id)"]
        CS -->|"Recursive 1:N<br/>Parent Substation -> Child Hub"| CS
        CS -->|"1:N Owns<br/>(ON DELETE CASCADE)"| CB
        CB -->|"1:N Equips<br/>(ON DELETE CASCADE)"| CP
    end

    subgraph ASSOC["3. Associative Transaction & Operations"]
        EV["ev_vehicle<br/>(PK: vehicle_id | FK: driver_id)"]
        TAR["tariff_plan<br/>(PK: tariff_id)"]
        CR["charging_reservation [Associative Entity]<br/>(PK: reservation_id)<br/>GiST Exclusion: (bay_id, tstzrange)"]
        MT["maintenance_ticket<br/>(PK: ticket_id)"]
        AUD["audit_station_telemetry_log<br/>(PK: audit_id)"]
    end

    DP -->|"1:N Owns"| EV
    DP -->|"FK: driver_id"| CR
    EV -->|"FK: vehicle_id"| CR
    CB -->|"FK: bay_id"| CR
    TAR -->|"FK: tariff_id"| CR

    DP -.->|"FK: reported_by_driver_id"| MT
    TP -.->|"FK: assigned_technician_id"| MT
    CB -->|"FK: bay_id"| MT

    CR -->|"Trigger Writes Audit"| AUD
    CS -->|"FK: station_id"| AUD
    CB -->|"FK: bay_id"| AUD
```

---

## 3. Foreign Key Referential Integrity & `ON DELETE` Rules Diagram

This diagram shows **why** each Foreign Key uses `ON DELETE CASCADE`, `ON DELETE RESTRICT`, or `ON DELETE SET NULL`:
- **`ON DELETE CASCADE` (Green):** Child rows cannot exist without their parent (e.g., deleting a `charging_station` deletes its physical `charging_bay`s and `connector_port`s; deleting a `user_account` deletes its `driver_profile`).
- **`ON DELETE RESTRICT` (Red):** Prevents accidental deletion of financial/billing records (e.g., you **cannot** delete a `tariff_plan`, `charging_bay`, `ev_vehicle`, or `driver_profile` if it is referenced in `charging_reservation`).
- **`ON DELETE SET NULL` (Blue):** Preserves historical tickets/logs even if the referenced user, parent station, or reservation is removed.

```mermaid
flowchart LR
    classDef cascade fill:#064e3b,stroke:#10b981,color:#ecfdf5;
    classDef restrict fill:#4c0519,stroke:#f43f5e,color:#ffe4e6;
    classDef setnull fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe;

    UA["user_account"]
    DP["driver_profile"]
    TP["technician_profile"]
    EV["ev_vehicle"]
    CS["charging_station"]
    CB["charging_bay"]
    CP["connector_port"]
    TAR["tariff_plan"]
    CR["charging_reservation"]
    MT["maintenance_ticket"]
    AUD["audit_station_telemetry_log"]

    %% CASCADE LINKS
    DP -->|"ON DELETE CASCADE"| UA
    TP -->|"ON DELETE CASCADE"| UA
    EV -->|"ON DELETE CASCADE"| DP
    CB -->|"ON DELETE CASCADE"| CS
    CP -->|"ON DELETE CASCADE"| CB
    MT -->|"ON DELETE CASCADE (bay_id)"| CB
    AUD -->|"ON DELETE CASCADE (station_id)"| CS
    AUD -->|"ON DELETE CASCADE (bay_id)"| CB

    %% RESTRICT LINKS (Financial & Booking Ledger Protection)
    CR ==>|"ON DELETE RESTRICT"| DP
    CR ==>|"ON DELETE RESTRICT"| EV
    CR ==>|"ON DELETE RESTRICT"| CB
    CR ==>|"ON DELETE RESTRICT"| TAR

    %% SET NULL LINKS (History Preservation)
    CS -.->|"ON DELETE SET NULL (parent_grid_node_id)"| CS
    MT -.->|"ON DELETE SET NULL (reported_by_driver_id)"| DP
    MT -.->|"ON DELETE SET NULL (assigned_technician_id)"| TP
    AUD -.->|"ON DELETE SET NULL (reservation_id)"| CR
```

---

## 4. Database Trigger & Stored Procedure Sequence Diagram

This sequence diagram shows how **PostgreSQL Stored Procedures** (`03_stored_procedures.sql`) and **Automated Triggers** (`02_triggers.sql`) execute inside the database engine during:
1. **Booking / Completing a Reservation**
2. **Reporting / Resolving a Maintenance Ticket**

```mermaid
sequenceDiagram
    autonumber
    actor User as Driver / Technician UI
    participant API as Express Backend
    participant PG as PostgreSQL 16 Engine
    participant TRG as Automated DB Triggers

    rect rgb(20, 40, 35)
    Note over User,TRG: Flow A: Atomic Slot Booking & Completion
    User->>API: Click "Confirm Booking" (bay_id, vehicle_id, start_time, end_time)
    API->>PG: SELECT * FROM sp_book_charging_bay_atomic(...)
    PG->>PG: 1. SELECT ... FROM charging_bay FOR UPDATE (Row Lock)
    PG->>PG: 2. Verify connector_port compatibility with ev_vehicle
    PG->>PG: 3. Check tstzrange overlap (GiST Exclusion Constraint)
    PG->>PG: 4. INSERT INTO charging_reservation (...) VALUES (...)
    PG->>TRG: Fires AFTER INSERT trigger: trg_audit_reservation_lifecycle
    TRG->>PG: INSERT INTO audit_station_telemetry_log (metric_snapshot JSONB)
    PG-->>API: Return reservation_id & estimated_cost
    API-->>User: Show Confirmed Reservation & Stream SQL
    end

    rect rgb(40, 30, 20)
    Note over User,TRG: Flow B: Maintenance Ticket Hardware Sync Trigger
    User->>API: Report Fault / Run Trial INSERT on maintenance_ticket
    API->>PG: INSERT INTO maintenance_ticket (bay_id, ticket_status='OPEN', ...)
    PG->>TRG: Fires AFTER INSERT trigger: trg_sync_bay_status_ticket
    TRG->>PG: UPDATE charging_bay SET bay_status = 'MAINTENANCE' WHERE bay_id = NEW.bay_id
    PG-->>API: Return ticket row (Bay is now automatically MAINTENANCE)
    User->>API: Resolve Ticket (ticket_status = 'RESOLVED')
    API->>PG: UPDATE maintenance_ticket SET ticket_status = 'RESOLVED' ...
    PG->>TRG: Fires AFTER UPDATE trigger: trg_sync_bay_status_ticket
    TRG->>PG: UPDATE charging_bay SET bay_status = 'AVAILABLE' WHERE bay_id = NEW.bay_id
    PG-->>API: Return resolved ticket (Bay is automatically AVAILABLE again)
    end
```

---

## 5. Analytical Views & Materialized View Lineage Diagram

This diagram shows how the 3 analytical views (`04_analytical_queries.sql`) aggregate data from the normalized tables:

```mermaid
flowchart LR
    subgraph TABLES["Normalized Base Tables"]
        CS["charging_station"]
        CB["charging_bay"]
        CR["charging_reservation"]
        MT["maintenance_ticket"]
        UA["user_account"]
        DP["driver_profile"]
        EV["ev_vehicle"]
    end

    subgraph VIEWS["Database Views & Materialized Views (04_analytical_queries.sql)"]
        MV["mv_station_performance_summary<br/>(Materialized View)<br/>• Total/Available Bays<br/>• Total Energy (kWh) & Revenue (₹)<br/>• Active Maintenance Tickets"]
        V1["v_driver_analytics_leaderboard<br/>(Window Function View)<br/>• DENSE_RANK() by Total kWh<br/>• Vehicle Count & Total Spend"]
        V2["v_grid_hierarchy_tree<br/>(Recursive CTE View)<br/>• WITH RECURSIVE GridFeederHierarchy<br/>• Root Substation -> Child Station Path"]
    end

    CS --> MV
    CB --> MV
    CR --> MV
    MT --> MV

    UA --> V1
    DP --> V1
    EV --> V1
    CR --> V1

    CS -->|"parent_grid_node_id = station_id"| V2
```
