/**
 * Dashboard routes — /api/dashboard  (all require authentication).
 *
 *  GET /overview               composite overview (provider cards + summary + recent)
 *  GET /charts                 composite charts payload for the UI
 *  GET /health-score           cloud health score (overall + per provider)
 *  GET /deployments/stats      deployment statistics
 *  GET /deployments/trends     deployment trends time series  ?days&provider
 *  GET /deployments            deployment history  ?page&limit&sort&search&provider&status&type
 *  GET /resource-utilization   resource inventory + modeled utilization
 *  GET /cost-summary           cost totals/breakdown/trends/savings
 *  GET /security-summary       security scores + findings
 *  GET /compliance-summary     compliance scores
 *
 * All dashboard data is read-only and available to every authenticated role
 * (Admin, Cloud Engineer, DevOps Engineer, Viewer).
 */
import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  scopeValidation,
  trendsValidation,
  listDeploymentsValidation
} from '../validations/dashboard.validation.js';

const router = Router();

router.use(authenticate);

router.get('/overview', validate(scopeValidation), dashboardController.overview);
router.get('/charts', validate(scopeValidation), dashboardController.charts);
router.get('/health-score', validate(scopeValidation), dashboardController.healthScore);
router.get('/deployments/stats', validate(scopeValidation), dashboardController.deploymentStats);
router.get('/deployments/trends', validate(trendsValidation), dashboardController.deploymentTrends);
router.get('/deployments', validate(listDeploymentsValidation), dashboardController.listDeployments);
router.get('/resource-utilization', validate(scopeValidation), dashboardController.resourceUtilization);
router.get('/cost-summary', validate(scopeValidation), dashboardController.costSummary);
router.get('/security-summary', validate(scopeValidation), dashboardController.securitySummary);
router.get('/compliance-summary', validate(scopeValidation), dashboardController.complianceSummary);

export default router;
