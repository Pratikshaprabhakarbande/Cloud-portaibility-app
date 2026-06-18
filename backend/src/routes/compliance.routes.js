/**
 * Compliance Checker routes — /api/compliance (authentication required).
 *   GET  /frameworks   supported frameworks
 *   POST /scan         run a compliance scan for a provider
 *   GET  /reports      paginated report history
 */
import { Router } from 'express';
import complianceController from '../controllers/compliance.controller.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { scanValidation, reportsValidation } from '../validations/compliance.validation.js';

const router = Router();
router.use(authenticate);

router.get('/frameworks', complianceController.frameworks);
router.post('/scan', validate(scanValidation), complianceController.scan);
router.get('/reports', validate(reportsValidation), complianceController.reports);

export default router;
