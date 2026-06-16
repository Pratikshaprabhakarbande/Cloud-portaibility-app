/**
 * Token service.
 * Manages persistence/revocation of refresh tokens and password-reset tokens.
 * Raw tokens are returned to the caller but only their SHA-256 hash is stored.
 */
import crypto from 'crypto';
import { Token } from '../models/index.js';
import { TOKEN_TYPES } from '../models/token.model.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry
} from '../utils/jwt.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

/** Issue a fresh access + refresh token pair and persist the refresh token. */
async function generateAuthTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await Token.create({
    tokenHash: hash(refreshToken),
    user: user.id ?? user._id,
    type: TOKEN_TYPES.REFRESH,
    expiresAt: getRefreshTokenExpiry()
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.jwt.accessExpiresIn
  };
}

/**
 * Validate a refresh token (signature + DB presence + not blacklisted),
 * rotate it (revoke old, issue new), and return a new token pair.
 */
async function rotateRefreshToken(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const tokenDoc = await Token.findOne({
    tokenHash: hash(refreshToken),
    type: TOKEN_TYPES.REFRESH,
    blacklisted: false
  });
  if (!tokenDoc) throw ApiError.unauthorized('Refresh token not recognized or revoked');

  // Revoke the used token (rotation prevents replay).
  await tokenDoc.deleteOne();

  return { userId: decoded.sub };
}

/** Revoke a single refresh token (logout). */
async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  await Token.deleteOne({ tokenHash: hash(refreshToken), type: TOKEN_TYPES.REFRESH });
}

/** Revoke all refresh tokens for a user (logout everywhere / password reset). */
async function revokeAllUserTokens(userId, type = TOKEN_TYPES.REFRESH) {
  await Token.deleteMany({ user: userId, type });
}

/** Create a one-time password-reset token; returns the RAW token. */
async function generateResetToken(user) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await Token.create({
    tokenHash: hash(rawToken),
    user: user.id ?? user._id,
    type: TOKEN_TYPES.RESET_PASSWORD,
    expiresAt: new Date(Date.now() + env.jwt.resetExpiresInMin * 60 * 1000)
  });
  return rawToken;
}

/** Consume a reset token: returns the userId if valid, else throws. */
async function consumeResetToken(rawToken) {
  const tokenDoc = await Token.findOne({
    tokenHash: hash(rawToken),
    type: TOKEN_TYPES.RESET_PASSWORD,
    blacklisted: false,
    expiresAt: { $gt: new Date() }
  });
  if (!tokenDoc) throw ApiError.badRequest('Invalid or expired reset token');
  const userId = tokenDoc.user;
  await tokenDoc.deleteOne(); // one-time use
  return userId;
}

export default {
  generateAuthTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateResetToken,
  consumeResetToken
};
