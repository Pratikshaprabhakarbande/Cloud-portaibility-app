/**
 * express-validator chains for dashboard query parameters.
 */
import { query } from 'express-validator';
import {
  PROVIDER_VALUES,
  DEPLOYMENT_STATUS_VALUES,
  DEPLOYMENT_TYPE_VALUES
} from '../config/constants.js';

export const trendsValidation = [
  query('days').optional().isInt({ min: 1, max: 90 }).toInt().withMessage('days must be 1-90'),
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider')
];

export const listDeploymentsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isString().trim(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider'),
  query('status').optional().isIn(DEPLOYMENT_STATUS_VALUES).withMessage('Invalid status'),
  query('type').optional().isIn(DEPLOYMENT_TYPE_VALUES).withMessage('Invalid type')
];
