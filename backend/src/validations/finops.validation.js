import { body, query } from 'express-validator';
import { PROVIDER_VALUES } from '../config/constants.js';

const SCOPE_VALUES = [...PROVIDER_VALUES, 'multi-cloud', 'multi', 'all', 'mock'];

export const scopeValidation = [
  query('provider').optional().isIn(SCOPE_VALUES).withMessage('Invalid provider scope')
];

export const analyzeValidation = [
  body('provider').isIn(PROVIDER_VALUES).withMessage('Invalid provider (aws|azure|gcp)')
];

export const reportsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider')
];
