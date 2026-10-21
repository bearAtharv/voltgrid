import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';

// Unified CTE query builder for station mesh and individual station fetches (always queries PostgreSQL directly so SQL Inspector captures every read)
const buildStationsQuery = (whereClause: string = '') => `
  WITH BaySlots AS (
    SELECT bay_id,
      jsonb_agg(
        jsonb_build_object('start_time', start_time, 'end_time', end_time, 'status', reservation_status)
        ORDER BY start_time ASC
      ) AS booked_slots
    FROM charging_reservation
    WHERE reservation_status IN ('CONFIRMED', 'ACTIVE')
      AND end_time >= CURRENT_TIMESTAMP
    GROUP BY bay_id
  ),
  BayConnectors AS (
    SELECT cb.bay_id, cb.station_id, cb.bay_number, cb.bay_status, cb.supports_fast_charge,
      COALESCE(bs.booked_slots, '[]'::jsonb) AS booked_slots,
      COALESCE(
        jsonb_agg(
          jsonb_build_object('connector_id', cp.connector_id, 'connector_type', cp.connector_type, 'max_power_kw', cp.max_power_kw, 'port_status', cp.port_status)
        ) FILTER (WHERE cp.connector_id IS NOT NULL), '[]'::jsonb
      ) AS connectors
    FROM charging_bay cb
    LEFT JOIN connector_port cp ON cb.bay_id = cp.bay_id
    LEFT JOIN BaySlots bs ON cb.bay_id = bs.bay_id
    GROUP BY cb.bay_id, cb.station_id, cb.bay_number, cb.bay_status, cb.supports_fast_charge, bs.booked_slots
  )
  SELECT cs.station_id, cs.station_name, cs.parent_grid_node_id, cs.latitude, cs.longitude,
    cs.street_address, cs.city, cs.max_grid_capacity_kw, cs.operational_status,
    COUNT(DISTINCT bc.bay_id) AS total_bays,
    COUNT(DISTINCT CASE WHEN bc.bay_status = 'AVAILABLE' THEN bc.bay_id END) AS available_bays,
    COUNT(DISTINCT CASE WHEN bc.bay_status = 'OCCUPIED' THEN bc.bay_id END) AS occupied_bays,
    COUNT(DISTINCT CASE WHEN bc.bay_status = 'MAINTENANCE' THEN bc.bay_id END) AS maintenance_bays,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('bay_id', bc.bay_id, 'bay_number', bc.bay_number, 'bay_status', bc.bay_status, 'supports_fast_charge', bc.supports_fast_charge, 'booked_slots', bc.booked_slots, 'connectors', bc.connectors)
        ORDER BY bc.bay_number
      ) FILTER (WHERE bc.bay_id IS NOT NULL), '[]'::jsonb
    ) AS bays
  FROM charging_station cs
  LEFT JOIN BayConnectors bc ON cs.station_id = bc.station_id
  ${whereClause}
  GROUP BY cs.station_id
  ORDER BY cs.city, cs.station_name;
`;

export const getStations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(buildStationsQuery());
    res.json({ success: true, source: 'DATABASE', data: result.rows });
  } catch (error) { next(error); }
};

export const getStationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(buildStationsQuery('WHERE cs.station_id = $1'), [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Station not found' });
      return;
    }
    res.json({ success: true, source: 'DATABASE', data: result.rows[0] });
  } catch (error) { next(error); }
};

export const getTariffPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(`SELECT * FROM tariff_plan ORDER BY base_price_per_kwh ASC;`);
    res.json({ success: true, source: 'DATABASE', data: result.rows });
  } catch (error) { next(error); }
};
