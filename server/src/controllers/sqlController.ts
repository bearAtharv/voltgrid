import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pg from 'pg';
import { pool, sandboxPool, logSqlExecution, getRecentQueries } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

const executeSqlSchema = z.object({
  query: z.string().min(1).max(5000)
});

// Forbidden destructive patterns for interactive web console sandbox (Defense-in-depth)
const FORBIDDEN_COMMANDS = [
  'DROP DATABASE',
  'DROP TABLE',
  'DROP SCHEMA',
  'TRUNCATE',
  'ALTER SYSTEM',
  'CREATE USER',
  'DROP USER',
  'GRANT ALL',
  'REVOKE ALL'
];

export const getSqlHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: getRecentQueries()
  });
};

export const executeSqlConsole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { query: rawQuery } = executeSqlSchema.parse(req.body);
    const trimmed = rawQuery.trim();
    const upper = trimmed.toUpperCase();

    // Security check: Block catastrophic destructive operations
    for (const forbidden of FORBIDDEN_COMMANDS) {
      if (upper.includes(forbidden)) {
        res.status(403).json({
          success: false,
          error: `Security Sandbox Violation: '${forbidden}' is blocked in the web console.`
        });
        return;
      }
    }

    const start = performance.now();
    const queryId = Math.random().toString(36).substring(2, 9);

    const client: pg.PoolClient = await pool.connect();

    try {
      // Allow SELECT, INSERT, UPDATE, DELETE while blocking DROP/TRUNCATE above; enforce 3s timeout
      await client.query("BEGIN; SET LOCAL statement_timeout = '3000';");
      const result = await client.query(trimmed);
      await client.query("COMMIT;");
      const durationMs = Number((performance.now() - start).toFixed(2));

      const columns = result.fields ? result.fields.map(f => f.name) : [];
      const rows = result.rows || [];

      // Log to terminal broadcast stream
      logSqlExecution({
        id: queryId,
        sql: trimmed,
        durationMs,
        rowCount: result.rowCount ?? rows.length,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString(),
        source: 'INTERACTIVE_CONSOLE'
      });

      res.json({
        success: true,
        columns,
        rows,
        rowCount: result.rowCount ?? rows.length,
        durationMs
      });
    } catch (err: any) {
      try {
        await client.query("ROLLBACK;");
      } catch {
        // Suppress rollback errors
      }

      const durationMs = Number((performance.now() - start).toFixed(2));

      logSqlExecution({
        id: queryId,
        sql: trimmed,
        durationMs,
        status: 'ERROR',
        error: err.message,
        timestamp: new Date().toLocaleTimeString(),
        source: 'INTERACTIVE_CONSOLE'
      });

      res.status(400).json({
        success: false,
        error: err.message,
        durationMs
      });
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

