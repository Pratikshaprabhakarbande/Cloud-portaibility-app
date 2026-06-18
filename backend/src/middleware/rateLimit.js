/**
 * Rate limiting middleware.
 * - `apiLimiter`: general API throttle (configurable via env).
 * - `authLimiter`: stricter limit for auth endpoints to slow brute-force.
 */
import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

export default apiLimiter;
