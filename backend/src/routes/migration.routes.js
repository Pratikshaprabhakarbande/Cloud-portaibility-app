/**
 * Migration Advisor routes — /api/migration (authentication required).
 *   GET  /compare   service-equivalence comparison (source vs target)
 *   POST /plan      generate + persist a migration plan
 *   GET  /reports   paginated report history
 */
import { Router } from 'express';
import migrationController from '../controllers/migration.controller.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { compareValidation, planValidation, reportsValidation } from '../validations/migration.validation.js';

const router = Router();
router.use(authenticate);

router.get('/compare', validate(compareValidation), migrationController.compare);
router.post('/plan', validate(planValidation), migrationController.plan);
router.get('/reports', validate(reportsValidation), migrationController.reports);

export default router;
