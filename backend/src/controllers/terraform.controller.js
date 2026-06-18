/**
 * Terraform controller — thin HTTP layer over terraform.service.
 * Each action records an audit entry in addition to deployment history.
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import terraformService from '../services/terraform.service.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

function makeAction(action) {
  return asyncHandler(async (req, res) => {
    const { provider } = req.body;
    const result = await terraformService.runTerraform(provider, action, req.user);
    auditLogRepository.record({
      actor: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: AUDIT_ACTIONS.DEPLOY,
      entityType: 'Terraform',
      entityId: result.id,
      description: `terraform ${action} (${result.mode}) on ${provider} -> ${result.status}`,
      metadata: { provider, action, mode: result.mode },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    return sendSuccess(res, { message: `Terraform ${action} complete`, data: result });
  });
}

export const init = makeAction('init');
export const validate = makeAction('validate');
export const plan = makeAction('plan');
export const apply = makeAction('apply');
export const destroy = makeAction('destroy');

export const history = asyncHandler(async (req, res) => {
  const data = await terraformService.getHistory(req.query);
  return sendSuccess(res, { message: 'Terraform deployment history', data });
});

export default { init, validate, plan, apply, destroy, history };
