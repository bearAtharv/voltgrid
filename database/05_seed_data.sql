-- ============================================================================
-- VoltGrid: Smart EV Charging & Infrastructure Management System
-- File: 05_seed_data.sql (Realistic Indian Multi-Table Seed Dataset)
-- ============================================================================

BEGIN;

-- 1. SEED TARIFF PLANS (Realistic Indian Commercial Rates in ₹ / kWh)
INSERT INTO tariff_plan (tariff_id, plan_name, base_price_per_kwh, peak_multiplier, idle_fee_per_minute, peak_start_time, peak_end_time)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'BESCOM City Standard (AC/DC)', 6.8000, 1.15, 0.50, '17:00:00', '22:00:00'),
    ('11111111-1111-1111-1111-111111111102', 'Tata Power SuperFast Highway Hub', 12.5000, 1.20, 1.00, '14:00:00', '20:00:00'),
    ('11111111-1111-1111-1111-111111111103', 'Green Solar Night Eco Saver', 4.5000, 1.10, 0.25, '19:00:00', '23:00:00'),
    ('11111111-1111-1111-1111-111111111104', 'Adani Total Energies Fleet Express', 9.2000, 1.18, 0.75, '09:00:00', '13:00:00')
ON CONFLICT (tariff_id) DO UPDATE 
SET base_price_per_kwh = EXCLUDED.base_price_per_kwh,
    plan_name = EXCLUDED.plan_name,
    peak_multiplier = EXCLUDED.peak_multiplier,
    idle_fee_per_minute = EXCLUDED.idle_fee_per_minute;

-- 2. SEED USERS & PROFILES (BCNF Specialization Hierarchy)
-- 2.1 Admin Account (Dr. Sunita Rao)
INSERT INTO user_account (account_id, email, password_hash, first_name, last_name, phone_number, user_role)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'sunita.rao@voltgrid.in', crypt('AdminSecret123!', gen_salt('bf')), 'Dr. Sunita', 'Rao', '+919845012345', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- 2.2 Technicians (Rajesh Kumar, Suresh Nair, Karthik Reddy)
INSERT INTO user_account (account_id, email, password_hash, first_name, last_name, phone_number, user_role)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'rajesh.tech@voltgrid.in', crypt('TechPass2026!', gen_salt('bf')), 'Rajesh', 'Kumar', '+919880198765', 'TECHNICIAN'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'suresh.tech@voltgrid.in', crypt('TechPass2026!', gen_salt('bf')), 'Suresh', 'Nair', '+919820123456', 'TECHNICIAN'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'karthik.tech@voltgrid.in', crypt('TechPass2026!', gen_salt('bf')), 'Karthik', 'Reddy', '+919849011223', 'TECHNICIAN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO technician_profile (account_id, employee_code, certification_grade, operational_zone, is_on_duty)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'TECH-BLR-101', 'Level 4 High Voltage Specialist', 'Bengaluru South & Electronic City', TRUE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'TECH-MUM-202', 'Level 3 FastCharge Specialist', 'Mumbai Metropolitan & BKC', TRUE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'TECH-HYD-303', 'Level 4 Liquid-Cooled CCS2 Lead', 'Hyderabad & NCR Highway Corridor', TRUE)
ON CONFLICT (employee_code) DO NOTHING;

-- 2.3 Indian EV Drivers (8 Diverse Profiles across Loyalty Tiers)
INSERT INTO user_account (account_id, email, password_hash, first_name, last_name, phone_number, user_role)
VALUES 
    ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aarav.patel@gmail.com', crypt('DriverPass1!', gen_salt('bf')), 'Aarav', 'Patel', '+919876543210', 'DRIVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'priya.sharma@yahoo.co.in', crypt('DriverPass2!', gen_salt('bf')), 'Priya', 'Sharma', '+919812345678', 'DRIVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'rohan.verma@techcorp.in', crypt('DriverPass3!', gen_salt('bf')), 'Rohan', 'Verma', '+919890123456', 'DRIVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'ananya.iyer@mobility.in', crypt('DriverPass4!', gen_salt('bf')), 'Ananya', 'Iyer', '+919844556677', 'DRIVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'vikram.malhotra@outlook.com', crypt('DriverPass5!', gen_salt('bf')), 'Vikram', 'Malhotra', '+919811223344', 'DRIVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'meera.kulkarni@zoho.in', crypt('DriverPass6!', gen_salt('bf')), 'Meera', 'Kulkarni', '+919848022334', 'DRIVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc7', 'kabir.singh@evfleet.in', crypt('DriverPass7!', gen_salt('bf')), 'Kabir', 'Singh', '+919810099887', 'DRIVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc8', 'divya.nair@proton.me', crypt('DriverPass8!', gen_salt('bf')), 'Divya', 'Nair', '+919822044556', 'DRIVER')
ON CONFLICT (email) DO NOTHING;

INSERT INTO driver_profile (account_id, driver_license_num, payment_customer_token, loyalty_tier)
VALUES 
    ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'KA-01-2021-0098412', 'tok_upi_aarav_hdfc', 'PLATINUM'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'MH-02-2022-0045192', 'tok_upi_priya_icici', 'GOLD'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'DL-04-2020-0081293', 'tok_upi_rohan_sbi', 'SILVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'KA-03-2023-0019284', 'tok_upi_ananya_axis', 'GOLD'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'MH-12-2021-0067341', 'tok_upi_vikram_kotak', 'STANDARD'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'TS-09-2022-0054120', 'tok_upi_meera_hdfc', 'PLATINUM'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc7', 'HR-26-2021-0033910', 'tok_upi_kabir_yes', 'SILVER'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc8', 'MH-01-2023-0077812', 'tok_upi_divya_idfc', 'GOLD')
ON CONFLICT (driver_license_num) DO NOTHING;

-- 3. SEED INDIAN ELECTRIC VEHICLES (Includes multi-vehicle ownership for Aarav Patel)
INSERT INTO ev_vehicle (vehicle_id, driver_id, vin_number, license_plate, make, model, battery_capacity_kwh, max_charge_rate_kw, connector_type)
VALUES 
    ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'MAT612345NEXON001', 'KA-01-EV-2024', 'Tata', 'Nexon EV Max', 40.50, 50.00, 'CCS2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd9', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'SAJ998877COMET009', 'KA-01-EV-8080', 'MG', 'Comet EV Urban', 17.30, 7.40, 'TYPE2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'KM8K1IONIQ5IND002', 'MH-02-EV-9999', 'Hyundai', 'Ioniq 5', 72.60, 230.00, 'CCS2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'SAJ123MGZSEV00003', 'DL-01-EV-4545', 'MG', 'ZS EV Excite', 50.30, 60.00, 'CCS2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'cccccccc-cccc-cccc-cccc-ccccccccccc4', 'MA1XUV400MAH00004', 'KA-05-EV-1122', 'Mahindra', 'XUV400 EL', 39.40, 50.00, 'CCS2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd5', 'cccccccc-cccc-cccc-cccc-ccccccccccc5', 'MAT89TIAGOEV00005', 'MH-14-EV-7878', 'Tata', 'Tiago EV LR', 24.00, 25.00, 'TYPE2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd6', 'cccccccc-cccc-cccc-cccc-ccccccccccc6', 'KNAE55KIAEV600006', 'TS-09-EV-6000', 'Kia', 'EV6 GT-Line', 77.40, 240.00, 'CCS2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd7', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', 'LC0CE4BYDATTO0007', 'HR-26-EV-3300', 'BYD', 'Atto 3 Extended', 60.48, 80.00, 'CCS2'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd8', 'cccccccc-cccc-cccc-cccc-ccccccccccc8', 'MAT44PUNCHEV00008', 'MH-01-EV-5511', 'Tata', 'Punch EV Empowered', 35.00, 50.00, 'CCS2')
ON CONFLICT (vin_number) DO NOTHING;

-- 4. SEED CHARGING STATIONS (Feeder Hierarchy for Recursive CTE across 4 Cities)
INSERT INTO charging_station (station_id, station_name, parent_grid_node_id, latitude, longitude, street_address, city, max_grid_capacity_kw, operational_status)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'Bengaluru Regional Grid Hub (Electronic City)', NULL, 12.845214, 77.660168, 'Phase 1, Hosur Road, Electronic City', 'Bengaluru', 6000.00, 'ACTIVE'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'Mumbai Metropolitan EV Hub (BKC Substation)', NULL, 19.065738, 72.868378, 'G Block, Bandra Kurla Complex', 'Mumbai', 8000.00, 'ACTIVE')
ON CONFLICT (latitude, longitude) DO NOTHING;

INSERT INTO charging_station (station_id, station_name, parent_grid_node_id, latitude, longitude, street_address, city, max_grid_capacity_kw, operational_status)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'Koramangala 80 Feet Road FastCharge Hub', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 12.935193, 77.624481, '80 Feet Main Road, 4th Block, Koramangala', 'Bengaluru', 1500.00, 'ACTIVE'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 'Kempegowda International Airport (BLR) SuperHub', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 13.198635, 77.706593, 'Terminal 2 P3 Parking, Devanahalli', 'Bengaluru', 2000.00, 'ACTIVE'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'Bandra-Kurla Complex (BKC) EV Depot', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 19.068212, 72.871452, 'Near Jio World Drive, BKC', 'Mumbai', 2500.00, 'ACTIVE'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 'Cybercity Highway Plaza FastCharger', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 28.495000, 77.089000, 'DLF Cybercity, NH-48 Sector 24', 'Gurugram (NCR)', 1800.00, 'ACTIVE'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', 'HITEC City Cyber Towers SuperHub', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 17.450412, 78.380891, 'Madhapur Main Road, HITEC City', 'Hyderabad', 2200.00, 'ACTIVE')
ON CONFLICT (latitude, longitude) DO NOTHING;

-- 5. SEED CHARGING BAYS (All 7 stations populated with physical bays)
INSERT INTO charging_bay (bay_id, station_id, bay_number, bay_status, supports_fast_charge)
VALUES 
    -- Bengaluru Regional Grid Hub (Station 1)
    ('ffffffff-ffff-ffff-ffff-fffffffffff9', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 1, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-ffffffffff0a', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 2, 'AVAILABLE', TRUE),

    -- Mumbai Metropolitan EV Hub (Station 2)
    ('ffffffff-ffff-ffff-ffff-ffffffffff0b', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 1, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-ffffffffff0c', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 2, 'AVAILABLE', FALSE),

    -- Koramangala Hub (Station 3)
    ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 1, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 2, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 3, 'MAINTENANCE', TRUE),
    
    -- BLR Airport SuperHub (Station 4)
    ('ffffffff-ffff-ffff-ffff-fffffffffff4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 1, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-fffffffffff5', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 2, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-ffffffffff0d', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 3, 'MAINTENANCE', TRUE),
    
    -- Mumbai BKC Depot (Station 5)
    ('ffffffff-ffff-ffff-ffff-fffffffffff6', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 1, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-fffffffffff7', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 2, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-fffffffffff8', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 3, 'MAINTENANCE', FALSE),

    -- Gurugram Cybercity Highway Plaza (Station 6)
    ('ffffffff-ffff-ffff-ffff-ffffffffff0e', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 1, 'OCCUPIED', TRUE),
    ('ffffffff-ffff-ffff-ffff-ffffffffff0f', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 2, 'AVAILABLE', TRUE),

    -- Hyderabad HITEC City SuperHub (Station 7)
    ('ffffffff-ffff-ffff-ffff-ffffffffff10', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', 1, 'AVAILABLE', TRUE),
    ('ffffffff-ffff-ffff-ffff-ffffffffff11', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', 2, 'AVAILABLE', TRUE)
ON CONFLICT (station_id, bay_number) DO NOTHING;

-- 6. SEED CONNECTOR PORTS
INSERT INTO connector_port (connector_id, bay_id, connector_type, max_power_kw, port_status)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'CCS2', 120.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000002', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'TYPE2', 22.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000003', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'CCS2', 60.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000004', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'CHAdeMO', 50.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000005', 'ffffffff-ffff-ffff-ffff-fffffffffff3', 'CCS2', 120.00, 'FAULTY'),
    ('10000000-0000-0000-0000-000000000006', 'ffffffff-ffff-ffff-ffff-fffffffffff4', 'CCS2', 180.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000007', 'ffffffff-ffff-ffff-ffff-fffffffffff4', 'NACS', 150.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000008', 'ffffffff-ffff-ffff-ffff-fffffffffff5', 'CCS2', 60.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000009', 'ffffffff-ffff-ffff-ffff-fffffffffff6', 'CCS2', 240.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000010', 'ffffffff-ffff-ffff-ffff-fffffffffff6', 'NACS', 200.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000011', 'ffffffff-ffff-ffff-ffff-fffffffffff7', 'CCS2', 60.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000012', 'ffffffff-ffff-ffff-ffff-fffffffffff8', 'TYPE2', 22.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000013', 'ffffffff-ffff-ffff-ffff-fffffffffff9', 'CCS2', 150.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000014', 'ffffffff-ffff-ffff-ffff-ffffffffff0a', 'CCS2', 120.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000015', 'ffffffff-ffff-ffff-ffff-ffffffffff0a', 'TYPE2', 22.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000016', 'ffffffff-ffff-ffff-ffff-ffffffffff0b', 'CCS2', 180.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000017', 'ffffffff-ffff-ffff-ffff-ffffffffff0c', 'TYPE2', 22.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000018', 'ffffffff-ffff-ffff-ffff-ffffffffff0d', 'CCS2', 240.00, 'FAULTY'),
    ('10000000-0000-0000-0000-000000000019', 'ffffffff-ffff-ffff-ffff-ffffffffff0e', 'CCS2', 120.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000020', 'ffffffff-ffff-ffff-ffff-ffffffffff0f', 'CCS2', 90.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000021', 'ffffffff-ffff-ffff-ffff-ffffffffff0f', 'TYPE2', 22.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000022', 'ffffffff-ffff-ffff-ffff-ffffffffff10', 'CCS2', 240.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000023', 'ffffffff-ffff-ffff-ffff-ffffffffff11', 'CCS2', 120.00, 'FUNCTIONAL'),
    ('10000000-0000-0000-0000-000000000024', 'ffffffff-ffff-ffff-ffff-ffffffffff11', 'TYPE2', 22.00, 'FUNCTIONAL')
ON CONFLICT (connector_id) DO NOTHING;

-- 7. SEED REALISTIC CHARGING RESERVATIONS & SLOTS (Completed, Active, Confirmed, Cancelled)
INSERT INTO charging_reservation (
    reservation_id, driver_id, vehicle_id, bay_id, tariff_id, 
    start_time, end_time, initial_soc_percent, target_soc_percent, 
    energy_delivered_kwh, total_amount_due, reservation_status, created_at
) VALUES 
    -- Completed Session 1 (Aarav Patel - Tata Nexon EV Max: 26.325 kWh @ ₹6.80 = ₹179.01)
    ('20000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 
     'ffffffff-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111101', 
     CURRENT_TIMESTAMP - INTERVAL '3 days 4 hours', CURRENT_TIMESTAMP - INTERVAL '3 days 2 hours', 
     20.00, 85.00, 26.325, 179.01, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '3 days 5 hours'),

    -- Completed Session 2 (Priya Sharma - Hyundai Ioniq 5: 36.300 kWh @ ₹12.50 = ₹453.75)
    ('20000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', 
     'ffffffff-ffff-ffff-ffff-fffffffffff4', '11111111-1111-1111-1111-111111111102', 
     CURRENT_TIMESTAMP - INTERVAL '2 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '2 days 4 hours', 
     30.00, 80.00, 36.300, 453.75, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '2 days 7 hours'),

    -- Completed Session 3 (Rohan Verma - MG ZS EV: 25.150 kWh @ ₹6.80 = ₹171.02)
    ('20000000-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'dddddddd-dddd-dddd-dddd-ddddddddddd3', 
     'ffffffff-ffff-ffff-ffff-fffffffffff6', '11111111-1111-1111-1111-111111111101', 
     CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours', CURRENT_TIMESTAMP - INTERVAL '1 day 16 hours', 
     25.00, 75.00, 25.150, 171.02, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1 day 19 hours'),

    -- Completed Session 4 (Meera Kulkarni - Kia EV6 GT-Line: 46.440 kWh @ ₹9.20 = ₹427.25)
    ('20000000-0000-0000-0000-000000000005', 'cccccccc-cccc-cccc-cccc-ccccccccccc6', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', 
     'ffffffff-ffff-ffff-ffff-ffffffffff10', '11111111-1111-1111-1111-111111111104', 
     CURRENT_TIMESTAMP - INTERVAL '1 day 12 hours', CURRENT_TIMESTAMP - INTERVAL '1 day 10 hours', 
     20.00, 80.00, 46.440, 427.25, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '1 day 13 hours'),

    -- Completed Session 5 (Ananya Iyer - Mahindra XUV400: 23.640 kWh @ ₹4.50 = ₹106.38)
    ('20000000-0000-0000-0000-000000000006', 'cccccccc-cccc-cccc-cccc-ccccccccccc4', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', 
     'ffffffff-ffff-ffff-ffff-fffffffffff9', '11111111-1111-1111-1111-111111111103', 
     CURRENT_TIMESTAMP - INTERVAL '20 hours', CURRENT_TIMESTAMP - INTERVAL '18 hours', 
     25.00, 85.00, 23.640, 106.38, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '21 hours'),

    -- Completed Session 6 (Divya Nair - Tata Punch EV: 21.000 kWh @ ₹6.80 = ₹142.80)
    ('20000000-0000-0000-0000-000000000007', 'cccccccc-cccc-cccc-cccc-ccccccccccc8', 'dddddddd-dddd-dddd-dddd-ddddddddddd8', 
     'ffffffff-ffff-ffff-ffff-ffffffffff0b', '11111111-1111-1111-1111-111111111101', 
     CURRENT_TIMESTAMP - INTERVAL '10 hours', CURRENT_TIMESTAMP - INTERVAL '8 hours', 
     20.00, 80.00, 21.000, 142.80, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '11 hours'),

    -- Completed Session 7 (Aarav Patel - MG Comet EV Urban: 10.380 kWh @ ₹4.50 = ₹46.71)
    ('20000000-0000-0000-0000-000000000008', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'dddddddd-dddd-dddd-dddd-ddddddddddd9', 
     'ffffffff-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111103', 
     CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', 
     30.00, 90.00, 10.380, 46.71, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '7 hours'),

    -- Active Live Session 8 (Kabir Singh - BYD Atto 3 at Gurugram Cybercity Bay #1)
    ('20000000-0000-0000-0000-000000000009', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', 'dddddddd-dddd-dddd-dddd-ddddddddddd7', 
     'ffffffff-ffff-ffff-ffff-ffffffffff0e', '11111111-1111-1111-1111-111111111102', 
     CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP + INTERVAL '1 hour 30 minutes', 
     18.00, 85.00, 40.520, 506.50, 'ACTIVE', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),

    -- Confirmed Upcoming Slot 9 (Aarav Patel - Nexon EV at Koramangala Bay #2: +2h to +4h)
    ('20000000-0000-0000-0000-000000000004', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 
     'ffffffff-ffff-ffff-ffff-fffffffffff2', '11111111-1111-1111-1111-111111111103', 
     CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '4 hours', 
     20.00, 80.00, 24.300, 109.35, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),

    -- Confirmed Upcoming Slot 10 (Aarav Patel - MG Comet EV at Bengaluru Grid Hub Bay #2: +5h to +7h)
    ('20000000-0000-0000-0000-000000000013', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'dddddddd-dddd-dddd-dddd-ddddddddddd9', 
     'ffffffff-ffff-ffff-ffff-ffffffffff0a', '11111111-1111-1111-1111-111111111101', 
     CURRENT_TIMESTAMP + INTERVAL '5 hours', CURRENT_TIMESTAMP + INTERVAL '7 hours', 
     25.00, 85.00, 10.380, 70.58, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '25 minutes'),

    -- Confirmed Upcoming Slot 11 (Aarav Patel - Nexon EV at BLR Airport SuperHub Bay #1: +8h to +10h)
    ('20000000-0000-0000-0000-000000000014', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 
     'ffffffff-ffff-ffff-ffff-fffffffffff4', '11111111-1111-1111-1111-111111111102', 
     CURRENT_TIMESTAMP + INTERVAL '8 hours', CURRENT_TIMESTAMP + INTERVAL '10 hours', 
     15.00, 80.00, 26.325, 329.06, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '22 minutes'),

    -- Confirmed Upcoming Slot 12 (Priya Sharma - Ioniq 5 at Mumbai BKC Bay #1: +3h to +5h)
    ('20000000-0000-0000-0000-000000000010', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', 
     'ffffffff-ffff-ffff-ffff-fffffffffff6', '11111111-1111-1111-1111-111111111104', 
     CURRENT_TIMESTAMP + INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '5 hours', 
     25.00, 80.00, 39.930, 367.36, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '20 minutes'),

    -- Confirmed Upcoming Slot 13 (Priya Sharma - Ioniq 5 at Mumbai BKC Bay #2: +6h to +8h)
    ('20000000-0000-0000-0000-000000000015', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', 
     'ffffffff-ffff-ffff-ffff-fffffffffff7', '11111111-1111-1111-1111-111111111101', 
     CURRENT_TIMESTAMP + INTERVAL '6 hours', CURRENT_TIMESTAMP + INTERVAL '8 hours', 
     20.00, 80.00, 43.560, 296.21, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '18 minutes'),

    -- Confirmed Upcoming Slot 14 (Meera Kulkarni - Kia EV6 at Hyderabad HITEC Bay #1: +4h to +6h)
    ('20000000-0000-0000-0000-000000000011', 'cccccccc-cccc-cccc-cccc-ccccccccccc6', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', 
     'ffffffff-ffff-ffff-ffff-ffffffffff10', '11111111-1111-1111-1111-111111111101', 
     CURRENT_TIMESTAMP + INTERVAL '4 hours', CURRENT_TIMESTAMP + INTERVAL '6 hours', 
     15.00, 85.00, 54.180, 368.42, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),

    -- Confirmed Upcoming Slot 15 (Meera Kulkarni - Kia EV6 at Hyderabad HITEC Bay #2: +7h to +9h)
    ('20000000-0000-0000-0000-000000000016', 'cccccccc-cccc-cccc-cccc-ccccccccccc6', 'dddddddd-dddd-dddd-dddd-ddddddddddd6', 
     'ffffffff-ffff-ffff-ffff-ffffffffff11', '11111111-1111-1111-1111-111111111104', 
     CURRENT_TIMESTAMP + INTERVAL '7 hours', CURRENT_TIMESTAMP + INTERVAL '9 hours', 
     20.00, 80.00, 46.440, 427.25, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '12 minutes'),

    -- Confirmed Upcoming Slot 16 (Kabir Singh - BYD Atto 3 at Gurugram Cybercity Bay #2: +3h to +5h)
    ('20000000-0000-0000-0000-000000000017', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', 'dddddddd-dddd-dddd-dddd-ddddddddddd7', 
     'ffffffff-ffff-ffff-ffff-ffffffffff0f', '11111111-1111-1111-1111-111111111102', 
     CURRENT_TIMESTAMP + INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '5 hours', 
     20.00, 80.00, 36.288, 453.60, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '10 minutes'),

    -- Cancelled Slot 17 (Vikram Malhotra - Tiago EV at Mumbai Hub Bay #2)
    ('20000000-0000-0000-0000-000000000012', 'cccccccc-cccc-cccc-cccc-ccccccccccc5', 'dddddddd-dddd-dddd-dddd-ddddddddddd5', 
     'ffffffff-ffff-ffff-ffff-ffffffffff0c', '11111111-1111-1111-1111-111111111103', 
     CURRENT_TIMESTAMP - INTERVAL '14 hours', CURRENT_TIMESTAMP - INTERVAL '12 hours', 
     30.00, 80.00, 0.000, 0.00, 'CANCELLED', CURRENT_TIMESTAMP - INTERVAL '15 hours')
ON CONFLICT (reservation_id) DO UPDATE
SET total_amount_due = EXCLUDED.total_amount_due,
    reservation_status = EXCLUDED.reservation_status;

-- 8. SEED MAINTENANCE INCIDENT TICKETS
INSERT INTO maintenance_ticket (
    ticket_id, bay_id, reported_by_driver_id, assigned_technician_id, 
    fault_category, severity_level, ticket_status, description, reported_at, resolved_at
) VALUES 
    ('30000000-0000-0000-0000-000000000001', 'ffffffff-ffff-ffff-ffff-fffffffffff3', 
     'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 
     'CCS2 Gun Latch Pin Damaged', 'HIGH', 'IN_PROGRESS', 
     'Physical lock pin on the 120kW CCS2 connector gun is cracked. Solenoid interlock fails handshake.', 
     CURRENT_TIMESTAMP - INTERVAL '4 hours', NULL),

    ('30000000-0000-0000-0000-000000000002', 'ffffffff-ffff-ffff-ffff-fffffffffff8', 
     'cccccccc-cccc-cccc-cccc-ccccccccccc5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 
     'UPI QR Display Unresponsive', 'LOW', 'OPEN', 
     'Dynamic UPI QR code screen occasionally fails to refresh on payment timeout.', 
     CURRENT_TIMESTAMP - INTERVAL '1 hour', NULL),

    ('30000000-0000-0000-0000-000000000003', 'ffffffff-ffff-ffff-ffff-ffffffffff0d', 
     'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 
     'DC Liquid Cooling Loop Pressure Drop', 'CRITICAL', 'OPEN', 
     'Coolant sensor on 240kW dispenser triggered low-pressure cut-off during high-current ramp.', 
     CURRENT_TIMESTAMP - INTERVAL '45 minutes', NULL),

    ('30000000-0000-0000-0000-000000000004', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 
     'cccccccc-cccc-cccc-cccc-ccccccccccc4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 
     'OCPP 1.6J Firmware TLS Handshake Patch', 'MEDIUM', 'RESOLVED', 
     'Updated dispenser controller TLS root certificate bundle and verified meter heartbeat.', 
     CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day 22 hours')
ON CONFLICT (ticket_id) DO NOTHING;

-- 9. SEED HARDWARE TELEMETRY SNAPSHOTS (OCPP Surge & Thermal Alert Examples)
INSERT INTO audit_station_telemetry_log (
    audit_id, station_id, bay_id, reservation_id, event_type, metric_snapshot, created_at
) VALUES
    ('40000000-0000-0000-0000-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'ffffffff-ffff-ffff-ffff-fffffffffff6', NULL,
     'OCPP_SURGE_ALERT', '{"voltage_v": 414.2, "current_a": 228.5, "power_kw": 94.6, "cable_temp_c": 38.4, "protocol": "OCPP-1.6J"}'::jsonb,
     CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('40000000-0000-0000-0000-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 'ffffffff-ffff-ffff-ffff-ffffffffff0d', NULL,
     'OCPP_THERMAL_ALERT', '{"voltage_v": 398.1, "current_a": 195.0, "power_kw": 77.6, "cable_temp_c": 43.8, "coolant_psi": 14.2}'::jsonb,
     CURRENT_TIMESTAMP - INTERVAL '50 minutes'),
    ('40000000-0000-0000-0000-000000000003', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 'ffffffff-ffff-ffff-ffff-ffffffffff0e', '20000000-0000-0000-0000-000000000009',
     'OCPP_SURGE_ALERT', '{"voltage_v": 409.5, "current_a": 218.0, "power_kw": 89.3, "cable_temp_c": 37.9, "soc_percent": 62}'::jsonb,
     CURRENT_TIMESTAMP - INTERVAL '15 minutes')
ON CONFLICT (audit_id) DO NOTHING;

COMMIT;

-- 10. REFRESH MATERIALIZED VIEW
REFRESH MATERIALIZED VIEW mv_station_performance_summary;
