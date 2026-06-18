/**
 * express-validator chains for the AI Cloud Advisor endpoints.
 */
import { body, query } from 'express-validator';
import {
  PROVIDER_VALUES,
  RECOMMENDATION_TYPE_VALUES
} from '../config/constants.js';

const SCOPE_VALUES = [...PROVIDER_VALUES, 'multi-cloud', 'multi', 'all', 'mock'];

export const generateValidation = [
  body('provider').optional().isIn(SCOPE_VALUES).withMessage('Invalid provider scope'),
  body('type').optional().isIn(RECOMMENDATION_TYPE_VALUES).withMessage('Invalid recommendation type')
];

export const listValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('type').optional().isIn(RECOMMENDATION_TYPE_VALUES).withMessage('Invalid recommendation type')
];
