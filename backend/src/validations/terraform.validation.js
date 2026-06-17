/**
 * express-validator chains for the Terraform automation endpoints.
 */
import { body, query } from 'express-validator';
import { PROVIDER_VALUES, DEPLOYMENT_STATUS_VALUES } from '../config/constants.js';

export const runValidation = [
  body('provider').isIn(PROVIDER_VALUES).withMessage('Invalid provider (aws|azure|gcp)')
];

export const historyValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider'),
  query('status').optional().isIn(DEPLOYMENT_STATUS_VALUES).withMessage('Invalid status')
];
