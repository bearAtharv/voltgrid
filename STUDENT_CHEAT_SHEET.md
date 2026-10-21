# VoltGrid DBMS — Personal Master Cheat Sheet (For You Only)

This guide is written **just for you** so you know **100% of what is doing what, how every table connects, what happens when you click any button, and the exact order to show your professor**.

---

## PART 1: The Best Order to Present & Demo Your Project (5–7 Minutes)

Follow this exact sequence during your evaluation so your teacher sees the database first and everything builds logically:

### Step 1: Start in the `SQL & DB Lab` Tab $\rightarrow$ `Tables & Keys` (2 Minutes)
1. Click **`SQL & DB Lab`** in the top navbar (or **`View DB Tables`** at the bottom right).
2. Stay on the first tab: **`Tables & Keys`**.
3. **What to tell the teacher:**
   > *"Our project is backed by a PostgreSQL 16 relational database (`voltgrid_db`) with **11 interconnected tables**. Right here in `Tables & Keys`, we can inspect every table live from PostgreSQL along with its Primary Key (`PK`), Foreign Keys (`FK`), `ON DELETE` rules, and child tables (`Referenced By`)."*
4. **Click these 4 tables in order to show the relationships:**
   - **`user_account` $\rightarrow$ click `driver_profile` under *Referenced By*:**
     - Point out that `account_id` is **both** the `PK` and the `FK -> user_account(account_id) [ON DELETE CASCADE]`. Explain: *"Drivers and Technicians inherit from `user_account`. If a user account is deleted, `ON DELETE CASCADE` automatically deletes their profile."*
   - **`charging_station` $\rightarrow$ click `charging_bay` under *Referenced By* $\rightarrow$ click `connector_port`:**
     - Explain: *"A Station has multiple Charging Bays (`1:N`), and each Bay has multiple physical Connector Ports (`CCS2`, `TYPE2`, `NACS`). They use `ON DELETE CASCADE` because a physical bay cannot exist if its station is removed."*
     - Also point out `parent_grid_node_id` on `charging_station`: *"This is a **self-referencing foreign key** (`charging_station` pointing to `charging_station`) that models main city substations feeding smaller local hubs."*
   - **`charging_reservation`:**
     - Point out its **4 Foreign Keys**: `driver_id`, `vehicle_id`, `bay_id`, and `tariff_id`—all using **`ON DELETE RESTRICT`**.
     - Explain: *"Because reservations are financial billing records, we used `ON DELETE RESTRICT` so nobody can accidentally delete a tariff plan, bay, or driver that has billing history."*

---

### Step 2: Switch to `SQL Runner` Tab $\rightarrow$ Show `SELECT` & Trial `INSERT` / `UPDATE` / `DELETE` (2 Minutes)
1. Click the **`SQL Runner`** tab inside the DB Lab.
2. **Show Read Queries (`SELECT` row):**
   - Click **`JOIN: Reservations & Drivers`** $\rightarrow$ Explain: *"This runs a 5-table `INNER JOIN` combining `charging_reservation`, `user_account`, `ev_vehicle`, `charging_bay`, and `charging_station`."*
   - Click **`Recursive CTE: Grid Hierarchy`** $\rightarrow$ Explain: *"This uses `WITH RECURSIVE` on `parent_grid_node_id` to trace the power grid tree from regional substations down to local hubs."*
3. **Show Write Queries (`Trial Writes` row — Professors love this!):**
   - Click **`INSERT: New Tariff Plan`** $\rightarrow$ It inserts `'Student Night Saver Plan'` into `tariff_plan` and returns the new row.
     - *(Optional flex)*: Click **`Tables & Keys`** $\rightarrow$ click **`tariff_plan`** $\rightarrow$ show her `'Student Night Saver Plan'` sitting inside the actual table! Then go back to **`SQL Runner`**.
   - Click **`INSERT: Fault Ticket (Fires Trigger)`** $\rightarrow$ Explain:
     > *"When we insert an `OPEN` ticket into `maintenance_ticket` for Bay #2, a **PostgreSQL `AFTER INSERT` Trigger (`trg_sync_bay_status_ticket`)** automatically updates `charging_bay` and sets Bay #2's status to `'MAINTENANCE'` without any extra application code!"*
   - Click **`UPDATE: Resolve Demo Ticket`** $\rightarrow$ Explain:
     > *"When we update `ticket_status` to `'RESOLVED'`, the same trigger automatically sets Bay #2 back to `'AVAILABLE'`."*
   - Click **`DELETE: Demo Tariff Plan`** $\rightarrow$ Deletes `'Student Night Saver Plan'` cleanly.

---

### Step 3: Show How UI Actions Run Live SQL in `Live Stream` (2 Minutes)
1. Open the **`Live Stream`** tab and click the **`INSERT / UPDATE / DELETE`** filter button at the top so only write queries are shown.
2. Go to **`My Activity`** in the top navbar:
   - Click **`Complete Charging`** on an active/confirmed reservation $\rightarrow$ enter `25` kWh $\rightarrow$ click **`Bill Session`**.
   - Point to the **`Live Stream`**: Show the exact `UPDATE charging_reservation cr SET reservation_status = 'COMPLETED' ... FROM tariff_plan tp` statement that just ran!
   - Or click **`Cancel Slot`** on a confirmed reservation $\rightarrow$ Point to the **`Live Stream`** showing `UPDATE charging_reservation SET reservation_status = 'CANCELLED' ...`.
3. Go to **`Stations`** in the top navbar:
   - Click **`Book Charging Slot`** on any green (`AVAILABLE`) bay $\rightarrow$ click **`Confirm Booking`**.
   - Point to the **`Live Stream`**: Show the `INSERT INTO charging_reservation (...) VALUES (...) RETURNING reservation_id;` query!

---

## PART 2: All 11 Tables — What Is Doing What & Related To What

Here is every table in `database/01_schema.sql` grouped logically so you never lose track:

### Group A: Users & Vehicles (4 Tables)
| Table Name | Primary Key (`PK`) | Foreign Keys (`FK`) & `ON DELETE` | What It Does & Why It Exists |
| :--- | :--- | :--- | :--- |
| **`user_account`** | `account_id` (UUID) | *None (Root Table)* | Stores login email, password hash, name, phone, and `user_role` (`DRIVER`, `TECHNICIAN`, `ADMIN`). |
| **`driver_profile`** | `account_id` (UUID) | `account_id` $\rightarrow$ `user_account(account_id)` **[CASCADE]** | **1:1 Subtype of `user_account`**. Stores driver-only fields (`driver_license_num`, `loyalty_tier`, `payment_customer_token`) so technicians/admins don't have `NULL` driver columns. |
| **`technician_profile`** | `account_id` (UUID) | `account_id` $\rightarrow$ `user_account(account_id)` **[CASCADE]** | **1:1 Subtype of `user_account`**. Stores technician-only fields (`employee_code`, `certification_grade`, `operational_zone`, `is_on_duty`). |
| **`ev_vehicle`** | `vehicle_id` (UUID) | `driver_id` $\rightarrow$ `driver_profile(account_id)` **[CASCADE]** | **1:N with `driver_profile`**. One driver (like Aarav Patel) can own multiple EVs (`Tata Nexon EV`, `MG Comet EV`). Stores `connector_type` (`CCS2`, `TYPE2`, `NACS`) and `battery_capacity_kwh`. |

### Group B: Physical Charging Hardware & Grid (3 Tables)
| Table Name | Primary Key (`PK`) | Foreign Keys (`FK`) & `ON DELETE` | What It Does & Why It Exists |
| :--- | :--- | :--- | :--- |
| **`charging_station`** | `station_id` (UUID) | `parent_grid_node_id` $\rightarrow$ `charging_station(station_id)` **[SET NULL]** | Stores physical charging hubs across cities (Bengaluru, Mumbai, Gurugram, Hyderabad). `parent_grid_node_id` points to a parent substation in the same table (**Recursive Relationship**). |
| **`charging_bay`** | `bay_id` (UUID) | `station_id` $\rightarrow$ `charging_station(station_id)` **[CASCADE]** | **Weak Entity (`1:N` under `charging_station`)**. Has a composite `UNIQUE(station_id, bay_number)` constraint so each station has Bay #1, Bay #2, etc. Tracks `bay_status` (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`). |
| **`connector_port`** | `connector_id` (UUID) | `bay_id` $\rightarrow$ `charging_bay(bay_id)` **[CASCADE]** | **1:N under `charging_bay`**. A single bay can have multiple physical plugs (e.g., one `CCS2` 120kW DC plug and one `TYPE2` 22kW AC plug). |

### Group C: Pricing, Bookings, Maintenance & Audit Logs (4 Tables)
| Table Name | Primary Key (`PK`) | Foreign Keys (`FK`) & `ON DELETE` | What It Does & Why It Exists |
| :--- | :--- | :--- | :--- |
| **`tariff_plan`** | `tariff_id` (UUID) | *None (Root Table)* | Stores electricity pricing plans (`base_price_per_kwh`, `peak_multiplier`, `idle_fee_per_minute`, peak hours). |
| **`charging_reservation`** | `reservation_id` (UUID) | • `driver_id` $\rightarrow$ `driver_profile` **[RESTRICT]**<br/>• `vehicle_id` $\rightarrow$ `ev_vehicle` **[RESTRICT]**<br/>• `bay_id` $\rightarrow$ `charging_bay` **[RESTRICT]**<br/>• `tariff_id` $\rightarrow$ `tariff_plan` **[RESTRICT]** | **Central Associative Entity**. Links **Driver + Vehicle + Bay + Tariff** for a time window (`start_time` to `end_time`). Uses a **GiST Exclusion Constraint** (`no_overlapping_active_reservations`) so PostgreSQL physically blocks double-booking the same bay for overlapping times. |
| **`maintenance_ticket`** | `ticket_id` (UUID) | • `bay_id` $\rightarrow$ `charging_bay` **[CASCADE]**<br/>• `reported_by_driver_id` $\rightarrow$ `driver_profile` **[SET NULL]**<br/>• `assigned_technician_id` $\rightarrow$ `technician_profile` **[SET NULL]** | Tracks hardware faults on a bay (`OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`). Uses `ON DELETE SET NULL` on driver/technician so fault history remains even if a staff/driver account is removed. |
| **`audit_station_telemetry_log`** | `audit_id` (UUID) | • `station_id` $\rightarrow$ `charging_station` **[CASCADE]**<br/>• `bay_id` $\rightarrow$ `charging_bay` **[CASCADE]**<br/>• `reservation_id` $\rightarrow$ `charging_reservation` **[SET NULL]** | Append-only audit table. Whenever a reservation is created, completed, or cancelled, Trigger `trg_audit_reservation_lifecycle` automatically inserts a JSONB snapshot here. |

---

## PART 3: What Happens When You Click Any Button in the Website

| Where You Click in UI | Backend File & Function | Exact SQL Query Executed on PostgreSQL | Any Trigger / Constraint Fired? |
| :--- | :--- | :--- | :--- |
| **Switch Persona** (Top Right Dropdown) | `authController.ts` $\rightarrow$ `quickLogin()` | `SELECT ua.*, dp.*, tp.*, jsonb_agg(ev.*) FROM user_account ua LEFT JOIN driver_profile dp ... LEFT JOIN ev_vehicle ev ... WHERE ua.email = $1 GROUP BY ...` | Joins `user_account` + subtype profile + `ev_vehicle` in 1 query. |
| **Stations Tab** (Loads all stations & bays) | `stationController.ts` $\rightarrow$ `getStations()` | `WITH BaySlots AS (...), BayConnectors AS (...) SELECT cs.*, COUNT(...), jsonb_agg(...) FROM charging_station cs LEFT JOIN BayConnectors bc ...` | Uses two CTEs (`WITH` clauses) and `LEFT JOIN`s across `charging_station`, `charging_bay`, `connector_port`, and `charging_reservation`. |
| **Confirm Booking** (Inside Book Slot Modal) | `reservationController.ts` $\rightarrow$ `bookReservation()` | Calls `sp_book_charging_bay_atomic(...)` which locks the bay (`SELECT ... FOR UPDATE`), checks connector compatibility & time overlap, and runs `INSERT INTO charging_reservation (...) VALUES (...) RETURNING reservation_id;` | 1. **GiST Constraint** checks no time overlap.<br/>2. **Trigger `trg_audit_reservation_lifecycle`** inserts audit log into `audit_station_telemetry_log`. |
| **Cancel Slot** (In *My Activity* Tab) | `reservationController.ts` $\rightarrow$ `cancelReservation()` | `UPDATE charging_reservation SET reservation_status = 'CANCELLED' WHERE reservation_id = $1 AND driver_id = $2 AND reservation_status = 'CONFIRMED' RETURNING ...` | **Trigger `trg_audit_reservation_lifecycle`** sets `charging_bay` to `'AVAILABLE'` and logs `'RESERVATION_CANCELLED'` in `audit_station_telemetry_log`. |
| **Complete Charging / Bill Session** (In *My Activity* Tab) | `reservationController.ts` $\rightarrow$ `completeSession()` | `UPDATE charging_reservation cr SET reservation_status = 'COMPLETED', energy_delivered_kwh = $2, total_amount_due = ROUND($2 * tp.base_price_per_kwh * tp.peak_multiplier, 2) FROM tariff_plan tp WHERE cr.reservation_id = $1 AND cr.tariff_id = tp.tariff_id RETURNING ...` | **Trigger `trg_audit_reservation_lifecycle`** sets `charging_bay` to `'AVAILABLE'` and logs final kWh & ₹ amount in `audit_station_telemetry_log`. |
| **Report Fault** (Warning icon on a Bay) | `ticketController.ts` $\rightarrow$ `createTicket()` | `INSERT INTO maintenance_ticket (bay_id, reported_by_driver_id, fault_category, severity_level, ticket_status, description) VALUES ($1, $2, $3, $4, 'OPEN', $5) RETURNING *;` | **Trigger `trg_sync_bay_status_ticket`** automatically runs `UPDATE charging_bay SET bay_status = 'MAINTENANCE' WHERE bay_id = NEW.bay_id`. |
| **Claim Ticket** (In *Maintenance* Tab) | `ticketController.ts` $\rightarrow$ `claimTicket()` | `UPDATE maintenance_ticket SET assigned_technician_id = $1, ticket_status = 'IN_PROGRESS' WHERE ticket_id = $2 AND ticket_status = 'OPEN' RETURNING *;` | Updates `assigned_technician_id` foreign key and sets status to `'IN_PROGRESS'`. |
| **Resolve Ticket** (In *Maintenance* Tab) | `ticketController.ts` $\rightarrow$ `resolveTicket()` | `UPDATE maintenance_ticket SET ticket_status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP WHERE ticket_id = $1 ... RETURNING *;` | **Trigger `trg_sync_bay_status_ticket`** checks no other open tickets exist on that bay and restores `charging_bay.bay_status = 'AVAILABLE'`. |
| **Analytics Tab** | `analyticsController.ts` | Queries `SELECT * FROM mv_station_performance_summary`, `SELECT * FROM v_driver_analytics_leaderboard`, and `SELECT * FROM v_grid_hierarchy_tree` | Reads from the **Materialized View**, **Window Function View**, and **Recursive CTE View**. |

---

## PART 4: All SQL Files in `database/` — Quick Map

If your teacher asks *"Show me your SQL files"*, open the `database/` folder:
1. **`database/01_schema.sql`** — Creates the 6 `ENUM` types, all **11 tables**, all `PRIMARY KEY`, `FOREIGN KEY` (`CASCADE` / `RESTRICT` / `SET NULL`), `UNIQUE`, `CHECK`, the **GiST Exclusion Constraint** (`no_overlapping_active_reservations`), and **7 indexes** (B-Tree, Partial, and GIN).
2. **`database/02_triggers.sql`** — Creates the **3 Automated Triggers**:
   - `trg_sync_bay_status_ticket` (Syncs `charging_bay.bay_status` to `'MAINTENANCE'` or `'AVAILABLE'` when a `maintenance_ticket` is opened or resolved).
   - `trg_audit_reservation_lifecycle` (Writes a JSONB audit row into `audit_station_telemetry_log` whenever a reservation changes status).
   - `trg_user_account_touch` (Automatically updates `updated_at = CURRENT_TIMESTAMP` on `user_account`).
3. **`database/03_stored_procedures.sql`** — Creates the **3 PL/pgSQL Stored Functions**:
   - `sp_book_charging_bay_atomic` (Pessimistic locking `SELECT ... FOR UPDATE`, connector compatibility check, time overlap check, cost calculation, and atomic `INSERT`).
   - `sp_cancel_reservation_atomic` (Safe cancellation under row lock).
   - `sp_complete_charging_session` (Final billing calculation).
4. **`database/04_analytical_queries.sql`** — Creates the **Materialized View & Views**:
   - `mv_station_performance_summary` (Materialized View aggregating bays, energy, revenue, and open faults per station).
   - `v_driver_analytics_leaderboard` (View using `DENSE_RANK() OVER (ORDER BY SUM(energy_delivered_kwh) DESC)`).
   - `v_grid_hierarchy_tree` (View using `WITH RECURSIVE` to build the station power feeder hierarchy).
5. **`database/05_seed_data.sql`** — Inserts realistic Indian EV data (4 tariffs, 12 users, 9 EVs, 7 stations across Bengaluru/Mumbai/Gurugram/Hyderabad, 17 bays, 24 connector ports, 12 reservations, 4 maintenance tickets).

---

## PART 5: Top 6 Viva Questions & Your Exact 2-Sentence Answers

1. **Q: "Why did you split `user_account`, `driver_profile`, and `technician_profile` into 3 separate tables instead of 1 `users` table?"**
   - **Your Answer:** *"If we put everything in one `users` table, every Driver row would have `NULL` values for `employee_code`, `certification_grade`, and `is_on_duty`, and every Technician row would have `NULL` for `driver_license_num` and `loyalty_tier`. Splitting them into a `user_account` parent table and `driver_profile` / `technician_profile` subtype tables linked by `account_id` (`ON DELETE CASCADE`) eliminates `NULL` anomalies."*

2. **Q: "How do you prevent two drivers from booking the exact same charging bay for overlapping times?"**
   - **Your Answer:** *"We prevent it at two levels inside PostgreSQL: first, `sp_book_charging_bay_atomic` locks the bay row using `SELECT ... FOR UPDATE`, and second, `charging_reservation` has a PostgreSQL `EXCLUDE USING gist (bay_id WITH =, tstzrange(start_time, end_time) WITH &&)` constraint that physically rejects overlapping time ranges for any `CONFIRMED` or `ACTIVE` booking."*

3. **Q: "Explain the difference between `ON DELETE CASCADE`, `ON DELETE RESTRICT`, and `ON DELETE SET NULL` in your schema."**
   - **Your Answer:** *"`ON DELETE CASCADE` is used for dependent hardware and profiles (deleting a `charging_station` deletes its `charging_bay`s). `ON DELETE RESTRICT` is used on `charging_reservation` so you cannot delete a `tariff_plan` or `driver_profile` that has financial billing records. `ON DELETE SET NULL` is used on `maintenance_ticket.assigned_technician_id` so if a technician leaves the company, the historical fault ticket is preserved with `assigned_technician_id = NULL`."*

4. **Q: "Where did you use a Trigger in your database, and why?"**
   - **Your Answer:** *"In `02_triggers.sql`, `trg_sync_bay_status_ticket` fires `AFTER INSERT OR UPDATE` on `maintenance_ticket`. Whenever an `'OPEN'` fault ticket is inserted, the trigger automatically updates `charging_bay.bay_status` to `'MAINTENANCE'`, and when the ticket is `'RESOLVED'`, it automatically restores the bay to `'AVAILABLE'`—guaranteeing hardware state is always consistent even if someone inserts a ticket directly via SQL."*

5. **Q: "Why did you use a Self-Referencing Foreign Key on `charging_station`?"**
   - **Your Answer:** *"`charging_station.parent_grid_node_id` references `charging_station(station_id)`. This models how a regional substation (like Bengaluru Electronic City Grid Hub) supplies power to child charging stations (like Koramangala Hub and Airport SuperHub), which we query using a `WITH RECURSIVE` CTE in `v_grid_hierarchy_tree`."*

6. **Q: "What is the difference between a normal View and your Materialized View (`mv_station_performance_summary`)?"**
   - **Your Answer:** *"A normal `VIEW` re-runs its underlying SQL query every time you `SELECT` from it, whereas our `MATERIALIZED VIEW` (`mv_station_performance_summary`) pre-computes the expensive 4-table `LEFT JOIN` and `SUM`/`COUNT` aggregations and stores the physical result on disk for fast dashboard reads."*
