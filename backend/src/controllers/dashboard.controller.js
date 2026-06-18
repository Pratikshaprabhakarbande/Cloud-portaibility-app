/**
 * Dashboard controller — thin HTTP layer over dashboard.service.
 * Reads the optional `?provider=` scope (aws|azure|gcp|multi-cloud|mock) and
 * records a lightweight audit "read" entry for the composite overview.
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import dashboardService from '../services/dashboard.service.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

const scopeOf = (req) => req.query.provider; // undefined => multi-cloud

export const overview = asyncHandler(async (req, res) => {
  const scope = scopeOf(req);
  const data = await dashboardService.getOverview(scope);
  auditLogRepository.record({
    actor: req.user?.id,
    actorEmail: req.user?.email,
    actorRole: req.user?.role,
    action: AUDIT_ACTIONS.READ,
    entityType: 'Dashboard',
    description: `Viewed dashboard overview (scope=${scope || 'multi-cloud'})`,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  return sendSuccess(res, { message: 'Dashboard overview', data });
});

export const charts = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCharts(scopeOf(req));
  return sendSuccess(res, { message: 'Dashboard charts', data });
});

export const healthScore = asyncHandler(async (req, res) => {
  const data = await dashboardService.getHealthScore(scopeOf(req));
  return sendSuccess(res, { message: 'Cloud health score', data });
});

export const deploymentStats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDeploymentStatistics(scopeOf(req));
  return sendSuccess(res, { message: 'Deployment statistics', data });
});

export const deploymentTrends = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDeploymentTrends({
    days: req.query.days,
    provider: req.query.provider
  });
  return sendSuccess(res, { message: 'Deployment trends', data });
});

export const resourceUtilization = asyncHandler(async (req, res) => {
  const data = await dashboardService.getResourceUtilization(scopeOf(req));
  return sendSuccess(res, { message: 'Resource utilization', data });
});

export const costSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCostSummary(scopeOf(req));
  return sendSuccess(res, { message: 'Cost summary', data });
});

export const securitySummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSecuritySummary(scopeOf(req));
  return sendSuccess(res, { message: 'Security summary', data });
});

export const complianceSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getComplianceSummary(scopeOf(req));
  return sendSuccess(res, { message: 'Compliance summary', data });
});

export const listDeployments = asyncHandler(async (req, res) => {
  const data = await dashboardService.listDeployments(req.query);
  return sendSuccess(res, { message: 'Deployment history', data });
});

export default {
  overview,
  charts,
  healthScore,
  deploymentStats,
  deploymentTrends,
  resourceUtilization,
  costSummary,
  securitySummary,
  complianceSummary,
  listDeployments
};
