import rateLimit from 'express-rate-limit';

/**
 * Authentication rate limiter
 * Protects login and quick-login endpoints against brute force and credential stuffing.
 * 20 attempts per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit headers
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

/**
 * SQL Sandbox Console rate limiter
 * Protects database against resource exhaustion and denial-of-service queries.
 * 30 query executions per 1-minute window per IP.
 */
export const sqlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 queries per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'SQL Console query rate limit reached (max 30 queries/minute). Please pause before retrying.'
  }
});
