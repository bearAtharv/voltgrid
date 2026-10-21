import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM v_driver_analytics_leaderboard ORDER BY global_energy_rank ASC;`
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const getGridHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM v_grid_hierarchy_tree;`
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const getStationPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM mv_station_performance_summary ORDER BY total_revenue_generated_usd DESC;`
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const getUtilizationTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM v_station_utilization_trends LIMIT 50;`
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const refreshMaterializedView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await query(`CALL sp_refresh_station_performance_view();`);
    const refreshed = await query(`SELECT * FROM mv_station_performance_summary;`);
    res.json({
      success: true,
      message: 'Materialized view mv_station_performance_summary refreshed concurrently.',
      data: refreshed.rows
    });
  } catch (error) {
    next(error);
  }
};
