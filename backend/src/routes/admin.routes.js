/**
 * Admin routes — /api/admin (Admin role only).
 *   GET /users   list all users (paginated)
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import userRepository from '../repositories/UserRepository.js';
import { ROLES } from '../config/constants.js';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/users', asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await userRepository.paginate({}, { page, limit, sort: '-createdAt' });
  return sendSuccess(res, { message: 'Users', data: result });
}));

export default router;
