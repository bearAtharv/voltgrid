# VoltGrid DBMS Presentation Deck (12 Slides + Speaker Notes)

> [!TIP]
> A ready-to-open PowerPoint file has also been generated in your project folder at:
> **[VoltGrid_DBMS_Presentation.pptx](file:///c:/Saran/projects/voltgrid/VoltGrid_DBMS_Presentation.pptx)**

---

## Slide 1: Title Slide
**Title:** VoltGrid: Smart EV Charging & Infrastructure Management System  
**Subtitle:** Relational Database Management System (PostgreSQL 16) Project  
**Key Highlights:**
- **Database Engine:** PostgreSQL 16 (`voltgrid_db`) with 11 Normalized Relational Tables
- **Core DBMS Concepts:** Supertype/Subtype Inheritance, Weak Entities, Recursive Hierarchy, GiST Exclusion Constraints, PL/pgSQL Stored Procedures, Automated Triggers, and Materialized Views
- **Interactive DB Lab:** Built-in Table & Key Explorer, Live SQL Runner (`SELECT` / `INSERT` / `UPDATE` / `DELETE`), and Real-Time SQL Stream

**Speaker Note:**  
*"Good morning/afternoon ma'am. Our project is VoltGrid, an EV Charging & Infrastructure Management System designed around a PostgreSQL 16 relational database. Instead of hiding the database behind the UI, we built an interactive Database Explorer inside the app so we can inspect all 11 tables, their primary/foreign keys, triggers, and live SQL queries directly."*

---

## Slide 2: Problem Statement & Why Relational DBMS?
**Title:** Problem Statement & Need for a Relational DBMS  
**Key Bullet Points:**
- **Concurrent Slot Booking:** Multiple EV drivers attempting to book the same charging bay at overlapping times causes double-booking unless enforced by ACID transactions and database constraints.
- **Hardware Compatibility:** EVs use different physical plugs (`CCS2`, `TYPE2`, `CHAdeMO`, `NACS`); bookings must validate vehicle-to-bay port compatibility at the database level.
- **Automated Hardware State Sync:** When a fault ticket is opened on a charging bay, the bay must immediately transition to `MAINTENANCE` and return to `AVAILABLE` only when all open faults are resolved.
- **Financial & Audit Integrity:** Completed charging sessions require strict referential integrity (`ON DELETE RESTRICT`) and an immutable telemetry audit log.

**Speaker Note:**  
*"EV charging networks have strict relational rules: two cars cannot plug into the same bay at the same time, a CCS2 vehicle cannot book a bay that only has a Type-2 port, and billing records must never be orphaned. That's why we enforced all business rules directly inside PostgreSQL."*

---

## Slide 3: Relational Schema Overview (11 Tables in 3 Domains)
**Title:** Database Architecture: 11 Interconnected Tables  
**Key Bullet Points:**
- **1. Identity & Fleet Domain (4 Tables):**
  - `user_account` (`PK: account_id`) — Base supertype table for all users
  - `driver_profile` (`PK, FK: account_id`) — Driver subtype (`driver_license_num`, `loyalty_tier`)
  - `technician_profile` (`PK, FK: account_id`) — Technician subtype (`employee_code`, `certification_grade`)
  - `ev_vehicle` (`PK: vehicle_id`, `FK: driver_id`) — Driver vehicles (`vin_number`, `connector_type`)
- **2. Physical Grid & Hardware Domain (3 Tables):**
  - `charging_station` (`PK: station_id`, `Self-FK: parent_grid_node_id`) — Charging hubs & substations
  - `charging_bay` (`PK: bay_id`, `FK: station_id`, `UK: station_id + bay_number`) — Physical bays
  - `connector_port` (`PK: connector_id`, `FK: bay_id`) — Physical charging plugs per bay
- **3. Billing, Operations & Audit Domain (4 Tables):**
  - `tariff_plan` (`PK: tariff_id`) — Time-of-day kWh pricing & peak multipliers
  - `charging_reservation` (`PK: reservation_id`) — 4-way associative entity linking Driver, Vehicle, Bay & Tariff
  - `maintenance_ticket` (`PK: ticket_id`) — Fault tracking linking Bay, Reporting Driver & Assigned Technician
  - `audit_station_telemetry_log` (`PK: audit_id`) — Trigger-populated JSONB audit trail

---

## Slide 4: Key EER Modeling Patterns Used
**Title:** Key EER Modeling Concepts in `voltgrid_db`  
**Key Bullet Points:**
- **Supertype / Subtype Specialization (`1:1` Shared PK):**
  - `driver_profile.account_id` and `technician_profile.account_id` are both `PRIMARY KEY` and `FOREIGN KEY REFERENCES user_account(account_id) ON DELETE CASCADE`.
  - Eliminates `NULL` columns across different user roles.
- **Recursive Self-Referencing Hierarchy (`1:N`):**
  - `charging_station.parent_grid_node_id` references `charging_station(station_id) ON DELETE SET NULL`.
  - Models regional substations feeding child charging stations.
- **Weak / Dependent Entity Identification:**
  - `charging_bay` enforces `UNIQUE (station_id, bay_number)` (`Bay #1`, `Bay #2` within each station) with `ON DELETE CASCADE`.
- **4-Way Associative Bridge Entity:**
  - `charging_reservation` connects `driver_profile`, `ev_vehicle`, `charging_bay`, and `tariff_plan`.

---

## Slide 5: Foreign Key Referential Integrity (`ON DELETE` Behavior)
**Title:** Referential Integrity: `CASCADE` vs `RESTRICT` vs `SET NULL`  
**Key Bullet Points:**
- **`ON DELETE CASCADE` (Dependent Entities & Subtypes):**
  - Used on `driver_profile`, `technician_profile`, `ev_vehicle`, `charging_bay`, and `connector_port`.
  - *Why:* If a `charging_station` is deleted, its physical `charging_bay`s and `connector_port`s cannot exist on their own.
- **`ON DELETE RESTRICT` (Financial & Booking Ledger Protection):**
  - Used on all 4 Foreign Keys of `charging_reservation` (`driver_id`, `vehicle_id`, `bay_id`, `tariff_id`).
  - *Why:* Prevents deleting a `tariff_plan`, `charging_bay`, or `driver_profile` that has historical billing records.
- **`ON DELETE SET NULL` (Historical Audit & Ticket Preservation):**
  - Used on `maintenance_ticket` (`reported_by_driver_id`, `assigned_technician_id`), `charging_station` (`parent_grid_node_id`), and `audit_station_telemetry_log` (`reservation_id`).
  - *Why:* Preserves fault and telemetry history even if a staff/driver account is removed.

---

## Slide 6: Domain Integrity (`ENUM` & `CHECK` Constraints)
**Title:** Domain Integrity: `ENUM` Types & `CHECK` Constraints  
**Key Bullet Points:**
- **6 Custom PostgreSQL `ENUM` Types:**
  - `user_role_enum` (`DRIVER`, `TECHNICIAN`, `ADMIN`)
  - `bay_status_enum` (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `OFFLINE`)
  - `connector_type_enum` (`TYPE1`, `TYPE2`, `CCS1`, `CCS2`, `CHAdeMO`, `NACS`)
  - `reservation_status_enum` (`PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `FAILED`)
  - `ticket_severity_enum` & `ticket_status_enum`
- **Table-Level `CHECK` Constraints (`01_schema.sql`):**
  - `chk_reservation_time_interval`: `CHECK (end_time > start_time)`
  - `chk_soc_progression`: `CHECK (target_soc_percent >= initial_soc_percent)`
  - `chk_resolution_time`: `CHECK (resolved_at IS NULL OR resolved_at >= reported_at)`
  - `chk_latitude_range` / `chk_longitude_range` & positive capacity/price checks

---

## Slide 7: Concurrency Control & Preventing Double-Booking
**Title:** Preventing Double-Booking: GiST Exclusion & Pessimistic Locking  
**Key Bullet Points:**
- **Layer 1 — Pessimistic Row Locking (`03_stored_procedures.sql`):**
  - `sp_book_charging_bay_atomic` executes `SELECT ... FROM charging_bay WHERE bay_id = p_bay_id FOR UPDATE` with `SET LOCAL lock_timeout = '3s'`.
  - Serializes concurrent booking transactions targeting the same physical bay.
- **Layer 2 — GiST Range Exclusion Constraint (`01_schema.sql`):**
  - `EXCLUDE USING gist (bay_id WITH =, tstzrange(start_time, end_time) WITH &&) WHERE (reservation_status IN ('CONFIRMED', 'ACTIVE'))`
  - Uses PostgreSQL's `btree_gist` index over timestamp ranges (`tstzrange`) so the database engine mathematically prevents two active reservations from overlapping on the same bay.

---

## Slide 8: Automated Database Triggers (`02_triggers.sql`)
**Title:** Active Database Logic: Automated PL/pgSQL Triggers  
**Key Bullet Points:**
- **Trigger 1 — `trg_sync_bay_status_ticket` (`AFTER INSERT OR UPDATE ON maintenance_ticket`):**
  - When a ticket is inserted as `'OPEN'` or `'IN_PROGRESS'`, automatically runs:
    `UPDATE charging_bay SET bay_status = 'MAINTENANCE' WHERE bay_id = NEW.bay_id;`
  - When updated to `'RESOLVED'` (and no other open tickets exist on that bay), automatically restores:
    `UPDATE charging_bay SET bay_status = 'AVAILABLE' WHERE bay_id = NEW.bay_id;`
- **Trigger 2 — `trg_audit_reservation_lifecycle` (`AFTER INSERT OR UPDATE ON charging_reservation`):**
  - Automatically syncs bay status (`OCCUPIED` / `AVAILABLE`) and inserts an immutable JSONB snapshot into `audit_station_telemetry_log`.
- **Trigger 3 — `trg_user_account_touch` (`BEFORE UPDATE ON user_account`):**
  - Automatically updates `NEW.updated_at = CURRENT_TIMESTAMP`.

---

## Slide 9: Stored Procedures & DML Operations (`INSERT` / `UPDATE` / `DELETE`)
**Title:** Transactional DML & Stored Procedures  
**Key Bullet Points:**
- **Atomic Booking (`sp_book_charging_bay_atomic`):**
  - Validates bay availability, checks `ev_vehicle.connector_type` against functional `connector_port` rows, computes estimated cost from `tariff_plan`, and inserts the `CONFIRMED` reservation.
- **Session Completion & Billing (`UPDATE ... FROM JOIN`):**
  - Calculates final bill directly in SQL using tariff rates and peak multipliers:
    `UPDATE charging_reservation cr SET reservation_status = 'COMPLETED', energy_delivered_kwh = $2, total_amount_due = ROUND($2 * tp.base_price_per_kwh * tp.peak_multiplier, 2) FROM tariff_plan tp WHERE cr.reservation_id = $1 AND cr.tariff_id = tp.tariff_id RETURNING *;`
- **Slot Cancellation (`UPDATE`):**
  - Releases the slot (`SET reservation_status = 'CANCELLED'`) and triggers telemetry logging.

---

## Slide 10: Analytical Views, Window Functions & Recursive CTEs
**Title:** Analytical SQL: Materialized View, Window Functions & Recursive CTE  
**Key Bullet Points:**
- **Materialized View (`mv_station_performance_summary`):**
  - Pre-aggregates a 4-table `LEFT JOIN` (`charging_station`, `charging_bay`, `charging_reservation`, `maintenance_ticket`) to compute total bays, available bays, kWh delivered, and total revenue (`₹`).
- **Window Function View (`v_driver_analytics_leaderboard`):**
  - Uses `DENSE_RANK() OVER (ORDER BY SUM(energy_delivered_kwh) DESC)` and `SUM(...) OVER (PARTITION BY loyalty_tier)` to rank drivers without collapsing rows.
- **Recursive CTE View (`v_grid_hierarchy_tree`):**
  - Uses `WITH RECURSIVE GridFeederHierarchy` to traverse `parent_grid_node_id` from Regional Grid Substations (`Tier 1`) down to Child Charging Stations (`Tier 2`).

---

## Slide 11: Strategic Indexing (`01_schema.sql`)
**Title:** Indexing Strategy for High-Performance Queries  
**Key Bullet Points:**
- **Composite B-Tree Indexes:**
  - `idx_station_city_status ON charging_station(city, operational_status)`
  - `idx_bay_station_status ON charging_bay(station_id, bay_status)`
  - `idx_reservation_driver_time ON charging_reservation(driver_id, start_time DESC)`
- **Partial B-Tree Indexes (Smaller footprint, faster lookups for active rows):**
  - `idx_reservation_active_window ON charging_reservation(bay_id, start_time, end_time) WHERE reservation_status IN ('CONFIRMED', 'ACTIVE')`
  - `idx_ticket_unresolved_bay ON maintenance_ticket(bay_id, severity_level) WHERE ticket_status IN ('OPEN', 'IN_PROGRESS')`
- **GIN Index for JSONB Telemetry:**
  - `idx_audit_telemetry_jsonb_gin ON audit_station_telemetry_log USING gin (metric_snapshot)`

---

## Slide 12: Live Demonstration Checklist
**Title:** Live Database Demonstration Flow  
**Key Bullet Points:**
1. **`Tables & Keys` Explorer:** Inspect all 11 tables, Primary Keys (`PK`), Foreign Keys (`FK`), `ON DELETE` rules, and click through parent-child relationships.
2. **`SQL Runner` — Read Queries:** Run 5-table `JOIN`s, `GROUP BY` revenue summaries, `WITH RECURSIVE` grid hierarchy, and `information_schema` Foreign Key catalog queries.
3. **`SQL Runner` — Trial Write Queries (`INSERT` / `UPDATE` / `DELETE`):**
   - `INSERT` a new tariff plan and verify it in `tariff_plan`
   - `INSERT` an open maintenance ticket and watch `trg_sync_bay_status_ticket` set Bay #2 to `MAINTENANCE`
   - `UPDATE` the ticket to `RESOLVED` and watch the trigger restore Bay #2 to `AVAILABLE`
4. **`Live Stream` (`INSERT / UPDATE / DELETE` Filter):** Complete or cancel a reservation in *My Activity* and watch the live `UPDATE` SQL stream in real time.
