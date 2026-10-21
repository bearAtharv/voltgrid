export type UserRole = 'DRIVER' | 'TECHNICIAN' | 'ADMIN';
export type BayStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type PortStatus = 'FUNCTIONAL' | 'FAULTY' | 'DECOMMISSIONED';
export type ConnectorType = 'TYPE1' | 'TYPE2' | 'CCS1' | 'CCS2' | 'CHAdeMO' | 'NACS';
export type ReservationStatus = 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketSeverity = SeverityLevel;

export interface ConnectorPort {
  connector_id: string;
  connector_type: ConnectorType;
  max_power_kw: number;
  port_status: PortStatus;
}

export interface BookedSlot {
  start_time: string;
  end_time: string;
  status: ReservationStatus;
}

export interface ChargingBay {
  bay_id: string;
  bay_number: number;
  bay_status: BayStatus;
  supports_fast_charge: boolean;
  booked_slots?: BookedSlot[];
  connectors: ConnectorPort[];
}

export interface Station {
  station_id: string;
  station_name: string;
  parent_grid_node_id: string | null;
  latitude: number;
  longitude: number;
  street_address: string;
  city: string;
  max_grid_capacity_kw: number;
  operational_status: string;
  total_bays: number;
  available_bays: number;
  occupied_bays: number;
  maintenance_bays: number;
  bays?: ChargingBay[];
}

export interface Vehicle {
  vehicle_id: string;
  vin_number: string;
  license_plate: string;
  make: string;
  model: string;
  battery_capacity_kwh: number;
  max_charge_rate_kw: number;
  connector_type: ConnectorType;
}

export interface TariffPlan {
  tariff_id: string;
  plan_name: string;
  base_price_per_kwh: number;
  peak_multiplier: number;
  idle_fee_per_minute: number;
  peak_start_time: string;
  peak_end_time: string;
}

export interface User {
  accountId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  driverProfile?: {
    licenseNumber: string;
    loyaltyTier: string;
  } | null;
  technicianProfile?: {
    employeeCode: string;
    grade: string;
    zone: string;
    isOnDuty: boolean;
  } | null;
  vehicles?: Vehicle[];
}

export interface Reservation {
  reservation_id: string;
  station_name: string;
  street_address: string;
  city: string;
  bay_number: number;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  connector_type: ConnectorType;
  tariff_name: string;
  start_time: string;
  end_time: string;
  initial_soc_percent: number;
  target_soc_percent: number;
  energy_delivered_kwh: number;
  total_amount_due: number;
  reservation_status: ReservationStatus;
  created_at: string;
}

export interface MaintenanceTicket {
  ticket_id: string;
  bay_id: string;
  bay_number: number;
  station_name: string;
  reported_by_name: string | null;
  assigned_technician_name: string | null;
  technician_code: string | null;
  fault_category: string;
  severity_level: SeverityLevel;
  ticket_status: TicketStatus;
  description: string;
  reported_at: string;
  resolved_at: string | null;
}

export interface DriverLeaderboardRow {
  driver_id: string;
  driver_name: string;
  email: string;
  loyalty_tier: string;
  total_sessions_completed: number;
  total_energy_kwh: number;
  total_spend_usd: number;
  global_energy_rank: number;
  tier_percentile_rank: number;
}

export interface GridHierarchyNode {
  station_id: string;
  station_name: string;
  parent_grid_node_id: string | null;
  city: string;
  max_grid_capacity_kw: number;
  grid_tier_depth: number;
  grid_routing_lineage: string;
}

export interface StationPerformanceSummary {
  station_id: string;
  station_name: string;
  city: string;
  total_reservations: number;
  total_energy_delivered_kwh: number;
  total_revenue_generated_usd: number;
  active_maintenance_incidents: number;
}
