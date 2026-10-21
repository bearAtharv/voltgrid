import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[API Error]', err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
    return;
  }

  // Handle Database Unreachable / Connection Refused Errors
  if (
    err.code === 'ECONNREFUSED' ||
    (Array.isArray(err.errors) && err.errors.some((e: any) => e.code === 'ECONNREFUSED'))
  ) {
    res.status(503).json({
      success: false,
      error: 'Database connection refused. PostgreSQL is not running on port 5432. Please start Docker Desktop or run: docker compose up -d postgres',
      code: 'DATABASE_UNAVAILABLE'
    });
    return;
  }

  // Handle PostgreSQL Specific Error Codes
  if (err.code) {
    switch (err.code) {
      case '23P01': // exclusion_violation
        res.status(409).json({
          success: false,
          error: 'Slot conflict: The requested bay already has an overlapping active reservation.',
          code: 'EXCLUSION_VIOLATION'
        });
        return;

      case '23505': // unique_violation
        res.status(409).json({
          success: false,
          error: 'Unique constraint violation: A resource with this identifier already exists.',
          code: 'UNIQUE_VIOLATION',
          detail: err.detail
        });
        return;

      case '23503': // foreign_key_violation
        res.status(400).json({
          success: false,
          error: 'Foreign key violation: Referenced parent record does not exist.',
          code: 'FOREIGN_KEY_VIOLATION'
        });
        return;

      case '55P03': // lock_not_available
        res.status(503).json({
          success: false,
          error: 'Resource is currently locked by a concurrent transaction. Please retry.',
          code: 'LOCK_NOT_AVAILABLE'
        });
        return;
    }
  }

  // Fallback 500
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
