/**
 * express-validator chains for dashboard query parameters.
 */
import { query } from 'express-validator';
import {
  PROVIDER_VALUES,
  DEPLOYMENT_STATUS_VALUES,
  DEPLOYMENT_TYPE_VALUES
} from '../config/constants.js';

// Provider "scope" accepted by dashboard endpoints (single provider or multi/mock).
const SCOPE_VALUES = [...PROVIDER_VALUES, 'multi-cloud', 'multi', 'all', 'mock'];

export const scopeValidation = [
  query('provider').optional().isIn(SCOPE_VALUES).withMessage('Invalid provider scope')
];

export const trendsValidation = [
  query('days').optional().isInt({ min: 1, max: 90 }).toInt().withMessage('days must be 1-90'),
  query('provider').optional().isIn(SCOPE_VALUES).withMessage('Invalid provider scope')
];

export const listDeploymentsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isString().trim(),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  // Deployment history filters a concrete provider only (no aggregate scope).
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider'),
  query('status').optional().isIn(DEPLOYMENT_STATUS_VALUES).withMessage('Invalid status'),
  query('type').optional().isIn(DEPLOYMENT_TYPE_VALUES).withMessage('Invalid type')
];
