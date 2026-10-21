import pg from 'pg';
import dotenv from 'dotenv';
import { getSocketIO } from '../sockets/socketHandler.js';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'voltgrid_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error] Unexpected idle client error:', err.message);
});

/**
 * Dedicated Read-Only Connection Pool for Interactive SQL Sandbox
 * Authenticates as `sandbox_readonly` (or falls back if unconfigured)
 * guaranteeing mathematical engine-level inability to execute DDL/DML.
 */
export const sandboxPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'voltgrid_db',
  user: process.env.SANDBOX_DB_USER || 'sandbox_readonly',
  password: process.env.SANDBOX_DB_PASSWORD || 'readonlypassword',
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

sandboxPool.on('error', (err) => {
  console.error('[Sandbox Pool Error] Unexpected idle client error:', err.message);
});

export interface SqlQueryLog {
  id: string;
  sql: string;
  params?: any[];
  durationMs: number;
  rowCount?: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  timestamp: string;
  source?: string;
}

// In-memory circular buffer for live SQL terminal inspector (last 50 queries)
const MAX_HISTORY = 50;
const queryHistory: SqlQueryLog[] = [];

export const logSqlExecution = (log: SqlQueryLog) => {
  queryHistory.unshift(log);
  if (queryHistory.length > MAX_HISTORY) {
    queryHistory.pop();
  }

  // Broadcast to live frontend SQL Terminal via WebSocket
  try {
    const io = getSocketIO();
    if (io) {
      io.emit('sql_executed', log);
    }
  } catch (err) {
    // Non-blocking socket broadcast
  }
};

export const getRecentQueries = (): SqlQueryLog[] => {
  return [...queryHistory];
};

/**
 * Instrumented query function measuring latency and streaming live SQL events to UI terminal
 */
export const query = async (text: string, params?: any[]): Promise<pg.QueryResult<any>> => {
  const start = performance.now();
  const queryId = Math.random().toString(36).substring(2, 9);
  const cleanSql = text.trim();

  try {
    const result = await pool.query(text, params);
    const durationMs = Number((performance.now() - start).toFixed(2));

    logSqlExecution({
      id: queryId,
      sql: cleanSql,
      params: params && params.length > 0 ? params : undefined,
      durationMs,
      rowCount: result.rowCount ?? undefined,
      status: 'SUCCESS',
      timestamp: new Date().toLocaleTimeString(),
      source: 'APP_MUTATION'
    });

    return result;
  } catch (err: any) {
    const durationMs = Number((performance.now() - start).toFixed(2));

    logSqlExecution({
      id: queryId,
      sql: cleanSql,
      params: params && params.length > 0 ? params : undefined,
      durationMs,
      status: 'ERROR',
      error: err.message,
      timestamp: new Date().toLocaleTimeString(),
      source: 'APP_MUTATION'
    });

    throw err;
  }
};

export const withTransaction = async <T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
