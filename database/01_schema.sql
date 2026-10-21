-- ============================================================================
-- VoltGrid: Smart EV Charging & Infrastructure Management System
-- File: 01_schema.sql (PostgreSQL 16 Physical DDL)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for GIST exclusion constraints on scalar types (UUID, etc.)

-- Drop existing objects if doing a clean re-run
DROP TABLE IF EXISTS audit_station_telemetry_log CASCADE;
DROP TABLE IF EXISTS maintenance_ticket CASCADE;
DROP TABLE IF EXISTS charging_reservation CASCADE;
DROP TABLE IF EXISTS connector_port CASCADE;
DROP TABLE IF EXISTS charging_bay CASCADE;
DROP TABLE IF EXISTS charging_station CASCADE;
DROP TABLE IF EXISTS ev_vehicle CASCADE;
DROP TABLE IF EXISTS technician_profile CASCADE;
DROP TABLE IF EXISTS driver_profile CASCADE;
DROP TABLE IF EXISTS user_account CASCADE;
DROP TABLE IF EXISTS tariff_plan CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS reservation_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_status_enum CASCADE;
DROP TYPE IF EXISTS ticket_severity_enum CASCADE;
DROP TYPE IF EXISTS connector_type_enum CASCADE;
DROP TYPE IF EXISTS bay_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;

-- ============================================================================
-- 1. ENUMS (Domain Categoricals)
-- ============================================================================

CREATE TYPE user_role_enum AS ENUM (
    'DRIVER',
    'TECHNICIAN',
    'ADMIN'
);

CREATE TYPE bay_status_enum AS ENUM (
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'MAINTENANCE',
    'OFFLINE'
);

CREATE TYPE connector_type_enum AS ENUM (
    'TYPE1',
    'TYPE2',
    'CCS1',
    'CCS2',
    'CHAdeMO',
    'NACS'
);

CREATE TYPE ticket_severity_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE ticket_status_enum AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);

CREATE TYPE reservation_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
    'FAILED'
);

-- ============================================================================
-- 2. CORE TABLES (BCNF Normalized Relational Schema)
-- ============================================================================

-- 2.1 User Base Identity Table (Generalization Supertype)
CREATE TABLE user_account (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    user_role user_role_enum NOT NULL DEFAULT 'DRIVER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2.2 Driver Subtype Table (Specialization Subclass)
CREATE TABLE driver_profile (
    account_id UUID PRIMARY KEY REFERENCES user_account(account_id) ON DELETE CASCADE,
    driver_license_num VARCHAR(50) NOT NULL UNIQUE,
    payment_customer_token VARCHAR(100),
    loyalty_tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    CONSTRAINT chk_loyalty_tier CHECK (loyalty_tier IN ('STANDARD', 'SILVER', 'GOLD', 'PLATINUM'))
);

-- 2.3 Technician Subtype Table (Specialization Subclass)
CREATE TABLE technician_profile (
    account_id UUID PRIMARY KEY REFERENCES user_account(account_id) ON DELETE CASCADE,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    certification_grade VARCHAR(50) NOT NULL,
    operational_zone VARCHAR(100) NOT NULL,
    is_on_duty BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.4 EV Vehicle Table
CREATE TABLE ev_vehicle (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES driver_profile(account_id) ON DELETE CASCADE,
    vin_number VARCHAR(17) NOT NULL UNIQUE,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    battery_capacity_kwh NUMERIC(6, 2) NOT NULL,
    max_charge_rate_kw NUMERIC(6, 2) NOT NULL,
    connector_type connector_type_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_battery_capacity_positive CHECK (battery_capacity_kwh > 0),
    CONSTRAINT chk_max_charge_rate_positive CHECK (max_charge_rate_kw > 0)
);

-- 2.5 Charging Station Hub Table
CREATE TABLE charging_station (
    station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_name VARCHAR(150) NOT NULL,
    parent_grid_node_id UUID REFERENCES charging_station(station_id) ON DELETE SET NULL, -- Enables Recursive Grid Hierarchy
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    max_grid_capacity_kw NUMERIC(8, 2) NOT NULL,
    operational_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_latitude_range CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_longitude_range CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_grid_capacity_positive CHECK (max_grid_capacity_kw > 0),
    CONSTRAINT uq_station_geo UNIQUE (latitude, longitude)
);

-- 2.6 Charging Bay Table (Weak Entity identified by station_id + bay_number)
CREATE TABLE charging_bay (
    bay_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES charging_station(station_id) ON DELETE CASCADE,
    bay_number INT NOT NULL,
    bay_status bay_status_enum NOT NULL DEFAULT 'AVAILABLE',
    supports_fast_charge BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_station_bay_number UNIQUE (station_id, bay_number),
    CONSTRAINT chk_bay_number_positive CHECK (bay_number > 0)
);

-- 2.7 Connector Port Table
CREATE TABLE connector_port (
    connector_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bay_id UUID NOT NULL REFERENCES charging_bay(bay_id) ON DELETE CASCADE,
    connector_type connector_type_enum NOT NULL,
    max_power_kw NUMERIC(6, 2) NOT NULL,
    port_status VARCHAR(20) NOT NULL DEFAULT 'FUNCTIONAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_connector_power_positive CHECK (max_power_kw > 0)
);

-- 2.8 Tariff Plan Table
CREATE TABLE tariff_plan (
    tariff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(100) NOT NULL UNIQUE,
    base_price_per_kwh NUMERIC(6, 4) NOT NULL,
    peak_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    idle_fee_per_minute NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    peak_start_time TIME NOT NULL,
    peak_end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_base_price_positive CHECK (base_price_per_kwh >= 0),
    CONSTRAINT chk_multiplier_positive CHECK (peak_multiplier >= 1.00),
    CONSTRAINT chk_idle_fee_non_negative CHECK (idle_fee_per_minute >= 0)
);

-- 2.9 Charging Reservation Table (Associative Entity with Overlap Exclusion Constraint)
CREATE TABLE charging_reservation (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES driver_profile(account_id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES ev_vehicle(vehicle_id) ON DELETE RESTRICT,
    bay_id UUID NOT NULL REFERENCES charging_bay(bay_id) ON DELETE RESTRICT,
    tariff_id UUID NOT NULL REFERENCES tariff_plan(tariff_id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    initial_soc_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    target_soc_percent NUMERIC(5, 2) NOT NULL DEFAULT 80.00,
    energy_delivered_kwh NUMERIC(8, 3) DEFAULT 0.000,
    total_amount_due NUMERIC(10, 2) DEFAULT 0.00,
    reservation_status reservation_status_enum NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint 1: Valid time interval
    CONSTRAINT chk_reservation_time_interval CHECK (end_time > start_time),
    -- Constraint 2: Valid battery state of charge range
    CONSTRAINT chk_initial_soc CHECK (initial_soc_percent BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_target_soc CHECK (target_soc_percent BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_soc_progression CHECK (target_soc_percent >= initial_soc_percent),
    
    -- Constraint 3: Structural Exclusion Constraint (Double-Booking Elimination at DB Engine Level)
    CONSTRAINT no_overlapping_active_reservations
    EXCLUDE USING gist (
        bay_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (reservation_status IN ('CONFIRMED', 'ACTIVE'))
);

-- 2.10 Maintenance & Incident Ticket Table
CREATE TABLE maintenance_ticket (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bay_id UUID NOT NULL REFERENCES charging_bay(bay_id) ON DELETE CASCADE,
    reported_by_driver_id UUID REFERENCES driver_profile(account_id) ON DELETE SET NULL,
    assigned_technician_id UUID REFERENCES technician_profile(account_id) ON DELETE SET NULL,
    fault_category VARCHAR(100) NOT NULL,
    severity_level ticket_severity_enum NOT NULL DEFAULT 'MEDIUM',
    ticket_status ticket_status_enum NOT NULL DEFAULT 'OPEN',
    description TEXT NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_resolution_time CHECK (resolved_at IS NULL OR resolved_at >= reported_at)
);

-- 2.11 Telemetry & Historical Audit Log Table
CREATE TABLE audit_station_telemetry_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES charging_station(station_id) ON DELETE CASCADE,
    bay_id UUID REFERENCES charging_bay(bay_id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES charging_reservation(reservation_id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    metric_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. STRATEGIC PERFORMANCE INDEXES
-- ============================================================================

-- Foreign Key Indexing (Eliminates full table scans during joins and cascades)
CREATE INDEX IF NOT EXISTS idx_ev_vehicle_driver ON ev_vehicle(driver_id);
CREATE INDEX IF NOT EXISTS idx_charging_station_parent ON charging_station(parent_grid_node_id);
CREATE INDEX IF NOT EXISTS idx_charging_bay_station ON charging_bay(station_id);
CREATE INDEX IF NOT EXISTS idx_connector_port_bay ON connector_port(bay_id);
CREATE INDEX IF NOT EXISTS idx_reservation_driver ON charging_reservation(driver_id);
CREATE INDEX IF NOT EXISTS idx_reservation_vehicle ON charging_reservation(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservation_bay ON charging_reservation(bay_id);
CREATE INDEX IF NOT EXISTS idx_reservation_tariff ON charging_reservation(tariff_id);
CREATE INDEX IF NOT EXISTS idx_ticket_bay ON maintenance_ticket(bay_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tech ON maintenance_ticket(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_ticket_driver ON maintenance_ticket(reported_by_driver_id);
CREATE INDEX IF NOT EXISTS idx_audit_station ON audit_station_telemetry_log(station_id);
CREATE INDEX IF NOT EXISTS idx_audit_bay ON audit_station_telemetry_log(bay_id);
CREATE INDEX IF NOT EXISTS idx_audit_reservation ON audit_station_telemetry_log(reservation_id);

-- Composite & Range Indexing for High-Frequency Scheduling Queries
CREATE INDEX IF NOT EXISTS idx_reservation_temporal ON charging_reservation(bay_id, start_time, end_time);

-- Partial Index on Active Reservations
CREATE INDEX IF NOT EXISTS idx_active_reservations ON charging_reservation(bay_id, start_time) 
WHERE reservation_status IN ('CONFIRMED', 'ACTIVE');

-- Partial Index on Open Maintenance Tickets
CREATE INDEX IF NOT EXISTS idx_open_maintenance_tickets ON maintenance_ticket(bay_id, ticket_status)
WHERE ticket_status IN ('OPEN', 'IN_PROGRESS');

-- GIN Index on Audit Telemetry JSONB
CREATE INDEX IF NOT EXISTS idx_audit_telemetry_gin ON audit_station_telemetry_log USING gin(metric_snapshot);

-- ============================================================================
-- 4. SECURITY & LEAST-PRIVILEGE SANDBOX ROLES
-- ============================================================================

-- Dedicated read-only role for interactive SQL terminal console sandbox
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sandbox_readonly') THEN
        CREATE ROLE sandbox_readonly WITH LOGIN PASSWORD 'readonlypassword';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE voltgrid_db TO sandbox_readonly;
GRANT USAGE ON SCHEMA public TO sandbox_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sandbox_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO sandbox_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO sandbox_readonly;

