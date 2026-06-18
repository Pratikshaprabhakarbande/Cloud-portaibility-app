/**
 * Authentication middleware.
 * Extracts the Bearer access token, verifies it, loads the user, and attaches
 * `req.user`. Rejects inactive or deleted accounts.
 */
import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/index.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

  req.user = user;
  req.token = token;
  next();
});

export default authenticate;
