import { body, query } from 'express-validator';
import { PROVIDER_VALUES, COMPLIANCE_FRAMEWORK_VALUES } from '../config/constants.js';

export const scanValidation = [
  body('provider').isIn(PROVIDER_VALUES).withMessage('Invalid provider (aws|azure|gcp)'),
  body('framework').optional().isIn(COMPLIANCE_FRAMEWORK_VALUES).withMessage('Invalid framework')
];

export const reportsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('provider').optional().isIn(PROVIDER_VALUES).withMessage('Invalid provider'),
  query('framework').optional().isIn(COMPLIANCE_FRAMEWORK_VALUES).withMessage('Invalid framework')
];
