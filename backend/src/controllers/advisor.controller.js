/**
 * AI Cloud Advisor controller.
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import advisorService from '../services/advisor.service.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

export const generate = asyncHandler(async (req, res) => {
  const data = await advisorService.generateAdvice({
    scope: req.body.provider,
    type: req.body.type,
    user: req.user
  });
  auditLogRepository.record({
    actor: req.user?.id,
    actorEmail: req.user?.email,
    actorRole: req.user?.role,
    action: AUDIT_ACTIONS.READ,
    entityType: 'AIRecommendation',
    entityId: data.id,
    description: `Generated AI advice (${data.engine.engine}) for ${data.scope}`,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  return sendCreated(res, { message: 'AI recommendation generated', data });
});

export const list = asyncHandler(async (req, res) => {
  const data = await advisorService.getRecommendations(req.query);
  return sendSuccess(res, { message: 'AI recommendations', data });
});

export default { generate, list };
