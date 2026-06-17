/**
 * Security Center controller — thin HTTP layer over security.service.
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import securityService from '../services/security.service.js';

export const overview = asyncHandler(async (_req, res) => {
  const data = await securityService.getOverview();
  return sendSuccess(res, { message: 'Security overview', data });
});

export const riskScore = asyncHandler(async (_req, res) => {
  const data = await securityService.getRiskScore();
  return sendSuccess(res, { message: 'Risk score', data });
});

export const failedLogins = asyncHandler(async (req, res) => {
  const data = await securityService.getFailedLogins({ hours: req.query.hours });
  return sendSuccess(res, { message: 'Failed logins', data });
});

export const accessLogs = asyncHandler(async (req, res) => {
  const data = await securityService.getAccessLogs(req.query);
  return sendSuccess(res, { message: 'Access logs', data });
});

export const events = asyncHandler(async (req, res) => {
  const data = await securityService.getSecurityEvents(req.query);
  return sendSuccess(res, { message: 'Security events', data });
});

export default { overview, riskScore, failedLogins, accessLogs, events };
