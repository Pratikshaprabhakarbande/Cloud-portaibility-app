/**
 * FinOps Optimizer routes — /api/finops (authentication required).
 *   GET  /summary          cost summary for a scope
 *   GET  /recommendations  rule-based cost recommendations + utilization
 *   POST /analyze          persist a CostReport for a provider
 *   GET  /reports          paginated report history
 */
import { Router } from 'express';
import finopsController from '../controllers/finops.controller.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { scopeValidation, analyzeValidation, reportsValidation } from '../validations/finops.validation.js';

const router = Router();
router.use(authenticate);

router.get('/summary', validate(scopeValidation), finopsController.summary);
router.get('/recommendations', validate(scopeValidation), finopsController.recommendations);
router.post('/analyze', validate(analyzeValidation), finopsController.analyze);
router.get('/reports', validate(reportsValidation), finopsController.reports);

export default router;
