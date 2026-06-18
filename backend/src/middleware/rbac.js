/**
 * Role-Based Access Control middleware.
 *
 * Usage:
 *   router.post('/x', authenticate, authorize(ROLES.ADMIN), handler)
 *   router.post('/y', authenticate, authorizeMin(ROLES.DEVOPS_ENGINEER), handler)
 *
 * `authorize(...roles)` allows an explicit set of roles.
 * `authorizeMin(role)` allows that role and anything ranked higher.
 */
import ApiError from '../utils/ApiError.js';
import { ROLE_RANK } from '../config/constants.js';

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

export function authorizeMin(minRole) {
  const min = ROLE_RANK[minRole] ?? Number.MAX_SAFE_INTEGER;
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    const rank = ROLE_RANK[req.user.role] ?? 0;
    if (rank < min) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

export default authorize;
