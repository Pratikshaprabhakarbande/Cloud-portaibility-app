import { body, query } from 'express-validator';
import { PROVIDER_VALUES } from '../config/constants.js';

export const compareValidation = [
  query('source').isIn(PROVIDER_VALUES).withMessage('Invalid source provider'),
  query('target').isIn(PROVIDER_VALUES).withMessage('Invalid target provider')
];

export const planValidation = [
  body('sourceProvider').isIn(PROVIDER_VALUES).withMessage('Invalid source provider'),
  body('targetProvider').isIn(PROVIDER_VALUES).withMessage('Invalid target provider'),
  body('targetProvider').custom((v, { req }) => {
    if (v === req.body.sourceProvider) throw new Error('sourceProvider and targetProvider must differ');
    return true;
  }),
  body('workloadName').optional().isString().trim().isLength({ max: 120 })
];

export const reportsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sourceProvider').optional().isIn(PROVIDER_VALUES),
  query('targetProvider').optional().isIn(PROVIDER_VALUES)
];
