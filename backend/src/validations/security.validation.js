/**
 * express-validator chains for Security Center endpoints.
 */
import { query } from 'express-validator';
import { AUDIT_ACTION_VALUES } from '../config/constants.js';

export const failedLoginsValidation = [
  query('hours').optional().isInt({ min: 1, max: 720 }).toInt().withMessage('hours must be 1-720')
];

export const accessLogsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('action').optional().isIn(AUDIT_ACTION_VALUES).withMessage('Invalid action'),
  query('success').optional().isBoolean().withMessage('success must be boolean'),
  query('actorEmail').optional().isString().trim().isLength({ max: 160 })
];

export const eventsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];
