/**
 * CSRF protection (double-submit cookie) for the optional cookie-based auth.
 *
 * No-op unless AUTH_COOKIE_REFRESH is enabled. Bearer-token requests are not
 * CSRF-prone and are skipped. For cookie-authenticated, state-changing requests
 * the `x-csrf-token` header must equal the non-HttpOnly `csrfToken` cookie.
 */
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default function csrfProtection(req, _res, next) {
  if (!env.auth.cookieRefresh) return next();

  const hasBearer = (req.headers.authorization || '').startsWith('Bearer ');
  if (hasBearer) return next(); // token-based auth is immune to CSRF
  if (!STATE_CHANGING.has(req.method)) return next();

  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.csrfToken;
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return next(ApiError.forbidden('Invalid or missing CSRF token'));
  }
  return next();
}
