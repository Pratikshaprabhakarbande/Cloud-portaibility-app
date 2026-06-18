/**
 * Security Center routes — /api/security (all require authentication).
 *
 *  GET /overview        risk + recent events summary   (any authenticated role)
 *  GET /risk-score      composite risk score            (any authenticated role)
 *  GET /failed-logins   failed-login tracking           (Cloud Engineer and above)
 *  GET /access-logs     raw audit trail (sensitive)      (Cloud Engineer and above)
 *  GET /events          security-relevant events         (Cloud Engineer and above)
 *
 * Raw access logs / events expose emails + IPs, so they are restricted to
 * Cloud Engineer and Admin roles.
 */
import { Router } from 'express';
import securityController from '../controllers/security.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeMin } from '../middleware/rbac.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import {
  failedLoginsValidation,
  accessLogsValidation,
  eventsValidation
} from '../validations/security.validation.js';

const router = Router();

router.use(authenticate);

const canViewSensitive = authorizeMin(ROLES.CLOUD_ENGINEER);

router.get('/overview', securityController.overview);
router.get('/risk-score', securityController.riskScore);
router.get('/failed-logins', canViewSensitive, validate(failedLoginsValidation), securityController.failedLogins);
router.get('/access-logs', canViewSensitive, validate(accessLogsValidation), securityController.accessLogs);
router.get('/events', canViewSensitive, validate(eventsValidation), securityController.events);

export default router;
