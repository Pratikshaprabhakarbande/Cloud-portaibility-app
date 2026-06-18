/**
 * JWT utilities — sign and verify access & refresh tokens.
 *
 * Access tokens are short-lived and carry the user id + role for RBAC.
 * Refresh tokens are long-lived, signed with a separate secret, and tracked
 * in the database so they can be revoked (see token.service.js).
 */
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import env from '../config/env.js';
import ApiError from './ApiError.js';

const TOKEN_TYPES = { ACCESS: 'access', REFRESH: 'refresh' };

/**
 * Sign a short-lived access token.
 * @param {object} user Mongoose user doc (or { id|_id, role })
 */
export function signAccessToken(user) {
  const payload = {
    sub: String(user.id ?? user._id),
    role: user.role,
    type: TOKEN_TYPES.ACCESS
  };
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.accessExpiresIn });
}

/** Sign a long-lived refresh token. */
export function signRefreshToken(user) {
  const payload = { sub: String(user.id ?? user._id), type: TOKEN_TYPES.REFRESH };
  // Unique token id (jti) guarantees every issued refresh token is distinct,
  // even when signed within the same second. Without it, rotation could delete
  // a token's record and immediately re-create an identical one, leaving the
  // "old" token still valid on reuse.
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    jwtid: crypto.randomUUID()
  });
}

/** Verify an access token; throws ApiError(401) on failure. */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (decoded.type !== TOKEN_TYPES.ACCESS) throw new Error('Wrong token type');
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}

/** Verify a refresh token; throws ApiError(401) on failure. */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    if (decoded.type !== TOKEN_TYPES.REFRESH) throw new Error('Wrong token type');
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
}

/** Compute the absolute expiry Date for a refresh token (for DB persistence). */
export function getRefreshTokenExpiry() {
  const decoded = jwt.decode(signRefreshToken({ _id: 'temp' }));
  return new Date(decoded.exp * 1000);
}

export { TOKEN_TYPES };
