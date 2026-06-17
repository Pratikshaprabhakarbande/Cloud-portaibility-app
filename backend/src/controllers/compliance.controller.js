import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import complianceService from '../services/compliance.service.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

export const frameworks = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Compliance frameworks', data: complianceService.getFrameworks() })
);

export const scan = asyncHandler(async (req, res) => {
  const data = await complianceService.runCheck({
    provider: req.body.provider,
    framework: req.body.framework,
    user: req.user
  });
  auditLogRepository.record({
    actor: req.user?.id,
    actorEmail: req.user?.email,
    actorRole: req.user?.role,
    action: AUDIT_ACTIONS.SCAN,
    entityType: 'ComplianceReport',
    entityId: data.id,
    description: `Compliance scan ${data.framework} on ${data.provider} -> ${data.complianceScore}`,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  return sendCreated(res, { message: 'Compliance scan complete', data });
});

export const reports = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Compliance reports', data: await complianceService.getReports(req.query) })
);

export default { frameworks, scan, reports };
