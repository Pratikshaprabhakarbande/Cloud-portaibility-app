/**
 * AI Cloud Advisor routes — /api/ai (all require authentication).
 *
 *  POST /advisor           generate recommendations   (DevOps Engineer and above)
 *  GET  /recommendations   recommendation history      (any authenticated role)
 *
 * Uses the rule-based engine by default (zero-cost, offline); LLM-ready.
 */
import { Router } from 'express';
import advisorController from '../controllers/advisor.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeMin } from '../middleware/rbac.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { generateValidation, listValidation } from '../validations/advisor.validation.js';

const router = Router();

router.use(authenticate);

router.post('/advisor', authorizeMin(ROLES.DEVOPS_ENGINEER), validate(generateValidation), advisorController.generate);
router.get('/recommendations', validate(listValidation), advisorController.list);

export default router;
