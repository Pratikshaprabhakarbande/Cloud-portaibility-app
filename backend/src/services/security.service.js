/**
 * Security Center service.
 *
 * Aggregates the existing immutable audit log + security reports + incidents
 * into a security posture view: risk score, failed-login tracking, access logs,
 * and security events. Read-only; no new persistence.
 */
import { AuditLog, IncidentReport } from '../models/index.js';
import { AUDIT_ACTIONS, INCIDENT_STATUS } from '../config/constants.js';
import { getSecuritySummary } from './dashboard.service.js';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

// Actions considered "security-relevant" for the events feed.
const SECURITY_ACTIONS = [
  AUDIT_ACTIONS.LOGIN,
  AUDIT_ACTIONS.LOGOUT,
  AUDIT_ACTIONS.DEPLOY,
  AUDIT_ACTIONS.ROLLBACK,
  AUDIT_ACTIONS.SCAN,
  AUDIT_ACTIONS.DELETE
];

/** Failed-login tracking within a time window. */
export async function getFailedLogins({ hours = 24 } = {}) {
  const since = new Date(Date.now() - hours * 3600 * 1000);
  const match = { action: AUDIT_ACTIONS.LOGIN, success: false, createdAt: { $gte: since } };
  const [total, bySource, recent] = await Promise.all([
    AuditLog.countDocuments(match),
    AuditLog.aggregate([
      { $match: match },
      { $group: { _id: { ip: '$ip', email: '$actorEmail' }, count: { $sum: 1 }, last: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]),
    AuditLog.find(match).sort('-createdAt').limit(10)
  ]);

  return {
    windowHours: hours,
    total,
    bySource: bySource.map((s) => ({ ip: s._id.ip, email: s._id.email, count: s.count, last: s.last })),
    recent: recent.map((e) => ({ email: e.actorEmail, ip: e.ip, at: e.createdAt, userAgent: e.userAgent }))
  };
}

/**
 * Composite risk score (0-100, higher = worse) derived from:
 *  - failed logins in the last 24h
 *  - open/investigating incidents
 *  - critical/high security findings (latest per provider)
 */
export async function getRiskScore() {
  const [failed, openIncidents, sec] = await Promise.all([
    getFailedLogins({ hours: 24 }),
    IncidentReport.countDocuments({
      isDeleted: { $ne: true },
      status: { $in: [INCIDENT_STATUS.OPEN, INCIDENT_STATUS.INVESTIGATING] }
    }),
    getSecuritySummary()
  ]);

  const findings = sec.providers.reduce(
    (acc, p) => {
      const s = p.findings || {};
      acc.critical += s.critical || 0;
      acc.high += s.high || 0;
      return acc;
    },
    { critical: 0, high: 0 }
  );

  const factors = {
    failedLogins: Math.min(failed.total * 5, 30),
    openIncidents: Math.min(openIncidents * 10, 30),
    findings: Math.min(findings.critical * 10 + findings.high * 5, 40)
  };
  const riskScore = clamp(factors.failedLogins + factors.openIncidents + factors.findings);

  return {
    riskScore,
    securityScore: 100 - riskScore,
    level: riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'elevated' : 'low',
    factors,
    inputs: { failedLogins24h: failed.total, openIncidents, criticalFindings: findings.critical, highFindings: findings.high }
  };
}

/** Paginated raw access logs (audit trail) with optional filters. */
export async function getAccessLogs({ page, limit, action, success, actorEmail } = {}) {
  const filter = {};
  if (action) filter.action = action;
  if (success !== undefined) filter.success = success === 'true' || success === true;
  if (actorEmail) filter.actorEmail = String(actorEmail).toLowerCase();

  const result = await AuditLog.paginate(filter, { page, limit, sort: '-createdAt' });
  return {
    ...result,
    results: result.results.map((e) => ({
      id: String(e.id),
      action: e.action,
      actorEmail: e.actorEmail,
      actorRole: e.actorRole,
      entityType: e.entityType,
      description: e.description,
      ip: e.ip,
      success: e.success,
      at: e.createdAt
    }))
  };
}

/** Recent security-relevant events (failures or sensitive actions). */
export async function getSecurityEvents({ page, limit } = {}) {
  const filter = { $or: [{ success: false }, { action: { $in: SECURITY_ACTIONS } }] };
  const result = await AuditLog.paginate(filter, { page, limit, sort: '-createdAt' });
  return {
    ...result,
    results: result.results.map((e) => ({
      id: String(e.id),
      action: e.action,
      actorEmail: e.actorEmail,
      actorRole: e.actorRole,
      description: e.description,
      ip: e.ip,
      success: e.success,
      at: e.createdAt
    }))
  };
}

/** Security Center overview (composite). */
export async function getOverview() {
  const [risk, failed, events] = await Promise.all([
    getRiskScore(),
    getFailedLogins({ hours: 24 }),
    getSecurityEvents({ page: 1, limit: 10 })
  ]);
  return {
    risk,
    failedLogins24h: failed.total,
    recentEvents: events.results,
    totalEvents: events.totalResults
  };
}

export default { getFailedLogins, getRiskScore, getAccessLogs, getSecurityEvents, getOverview };
