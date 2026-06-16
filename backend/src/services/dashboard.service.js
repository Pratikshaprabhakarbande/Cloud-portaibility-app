/**
 * Dashboard service — aggregates live data from the Phase 3 models for Module 2.
 * Pure shaping/scoring logic lives in dashboard.helpers.js (unit-tested).
 */
import {
  Deployment,
  CloudResource,
  SecurityReport,
  ComplianceReport,
  CostReport,
  IncidentReport
} from '../models/index.js';
import deploymentRepository from '../repositories/DeploymentRepository.js';
import {
  PROVIDER_VALUES,
  DEPLOYMENT_STATUS,
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  INCIDENT_STATUS
} from '../config/constants.js';
import {
  PROVIDER_LABELS,
  PROVIDER_DEFAULT_REGIONS,
  computeSuccessRate,
  computeProviderHealth,
  statusFromHealth,
  computeChangePct,
  aggregateUsageShare,
  reshapeDeploymentTrends,
  buildUtilizationSeries,
  round
} from './dashboard.helpers.js';

const NOT_DELETED = { isDeleted: { $ne: true } };

/* ----------------------------- low-level aggregates ----------------------------- */

/** provider -> { status: count } */
async function deploymentStatusByProvider() {
  const rows = await Deployment.aggregate([
    { $match: NOT_DELETED },
    { $group: { _id: { provider: '$provider', status: '$status' }, count: { $sum: 1 } } }
  ]);
  const map = {};
  for (const r of rows) {
    const { provider, status } = r._id;
    map[provider] = map[provider] || {};
    map[provider][status] = r.count;
  }
  return map;
}

/** provider -> latest numeric score for the given field (e.g. securityScore). */
async function latestScoreByProvider(Model, field, extraFields = []) {
  const rows = await Model.aggregate([
    { $match: NOT_DELETED },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$provider',
        score: { $first: `$${field}` },
        ...Object.fromEntries(extraFields.map((f) => [f, { $first: `$${f}` }]))
      }
    }
  ]);
  const map = {};
  for (const r of rows) map[r._id] = r;
  return map;
}

/** provider -> running container/kubernetes resource count. */
async function runningContainersByProvider() {
  const rows = await CloudResource.aggregate([
    {
      $match: {
        ...NOT_DELETED,
        type: { $in: [RESOURCE_TYPES.CONTAINER, RESOURCE_TYPES.KUBERNETES] },
        status: RESOURCE_STATUS.RUNNING
      }
    },
    { $group: { _id: '$provider', count: { $sum: 1 } } }
  ]);
  const map = {};
  for (const r of rows) map[r._id] = r.count;
  return map;
}

/** provider -> latest cost snapshot { dailyCost, monthlyCost, projectedCost, savings }. */
async function latestCostByProvider() {
  const rows = await CostReport.aggregate([
    { $match: NOT_DELETED },
    { $sort: { 'period.date': -1, createdAt: -1 } },
    {
      $group: {
        _id: '$provider',
        dailyCost: { $first: '$dailyCost' },
        monthlyCost: { $first: '$monthlyCost' },
        projectedCost: { $first: '$projectedCost' },
        savings: { $first: '$totalPotentialSavings' }
      }
    }
  ]);
  const map = {};
  for (const r of rows) map[r._id] = r;
  return map;
}

/* ------------------------------- public methods -------------------------------- */

/** Per-provider health + overall score. */
export async function getHealthScore() {
  const [deployMap, secMap, compMap] = await Promise.all([
    deploymentStatusByProvider(),
    latestScoreByProvider(SecurityReport, 'securityScore'),
    latestScoreByProvider(ComplianceReport, 'complianceScore')
  ]);

  const providers = PROVIDER_VALUES.map((key) => {
    const successRate = computeSuccessRate(deployMap[key] || {});
    const securityScore = secMap[key]?.score ?? null;
    const complianceScore = compMap[key]?.score ?? null;
    const health = computeProviderHealth({ successRate, securityScore, complianceScore });
    return {
      key,
      name: PROVIDER_LABELS[key],
      healthScore: health,
      status: statusFromHealth(health),
      metrics: { successRate, securityScore, complianceScore }
    };
  });

  const overall = round(providers.reduce((s, p) => s + p.healthScore, 0) / providers.length);
  return { overall, status: statusFromHealth(overall), providers };
}

/** Deployment statistics: totals, by status, by provider, success rate. */
export async function getDeploymentStatistics() {
  const [byStatusRows, byProviderRows, total] = await Promise.all([
    Deployment.aggregate([{ $match: NOT_DELETED }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Deployment.aggregate([{ $match: NOT_DELETED }, { $group: { _id: '$provider', count: { $sum: 1 } } }]),
    Deployment.countDocuments(NOT_DELETED)
  ]);

  const byStatus = {};
  for (const r of byStatusRows) byStatus[r._id] = r.count;
  const byProvider = {};
  for (const r of byProviderRows) byProvider[r._id] = r.count;

  const active =
    (byStatus[DEPLOYMENT_STATUS.SUCCESS] || 0) + (byStatus[DEPLOYMENT_STATUS.IN_PROGRESS] || 0);

  return {
    total,
    active,
    successRate: computeSuccessRate(byStatus),
    byStatus,
    byProvider
  };
}

/** Deployment trends time series (zero-filled). */
export async function getDeploymentTrends({ days = 7, provider } = {}) {
  const rows = await deploymentRepository.trends({ days, provider });
  return reshapeDeploymentTrends(rows, days);
}

/** Resource inventory aggregates + modeled utilization series. */
export async function getResourceUtilization() {
  const [byType, byStatus, byProvider, total, running] = await Promise.all([
    CloudResource.aggregate([{ $match: NOT_DELETED }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    CloudResource.aggregate([{ $match: NOT_DELETED }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    CloudResource.aggregate([{ $match: NOT_DELETED }, { $group: { _id: '$provider', count: { $sum: 1 } } }]),
    CloudResource.countDocuments(NOT_DELETED),
    CloudResource.countDocuments({ ...NOT_DELETED, status: RESOURCE_STATUS.RUNNING })
  ]);

  const toMap = (rows) => rows.reduce((a, r) => ({ ...a, [r._id]: r.count }), {});
  const runningRatio = total > 0 ? running / total : 0.5;

  return {
    totals: { total, running },
    byType: toMap(byType),
    byStatus: toMap(byStatus),
    byProvider: toMap(byProvider),
    series: buildUtilizationSeries(runningRatio),
    source: 'modeled', // becomes 'prometheus' in Phase 11
    note: 'Utilization is modeled from running-resource ratio until Prometheus integration (Phase 11).'
  };
}

/** Monthly cost trends pivoted by provider for the last N months. */
export async function getCostTrends({ months = 6 } = {}) {
  const rows = await CostReport.aggregate([
    { $match: NOT_DELETED },
    { $group: { _id: { month: '$period.month', provider: '$provider' }, cost: { $sum: '$monthlyCost' } } },
    { $sort: { '_id.month': 1 } }
  ]);

  const byMonth = new Map();
  for (const r of rows) {
    const { month, provider } = r._id;
    if (!byMonth.has(month)) byMonth.set(month, { month, aws: 0, azure: 0, gcp: 0 });
    byMonth.get(month)[provider] = round(r.cost);
  }
  return Array.from(byMonth.values()).slice(-months);
}

/** Cost summary: daily/monthly/projected totals + per-provider breakdown + savings. */
export async function getCostSummary() {
  const [costMap, trends] = await Promise.all([latestCostByProvider(), getCostTrends({ months: 6 })]);

  const breakdown = PROVIDER_VALUES.map((key) => ({
    provider: key,
    name: PROVIDER_LABELS[key],
    dailyCost: round(costMap[key]?.dailyCost || 0),
    monthlyCost: round(costMap[key]?.monthlyCost || 0),
    projectedCost: round(costMap[key]?.projectedCost || 0),
    savings: round(costMap[key]?.savings || 0)
  }));

  const totals = breakdown.reduce(
    (acc, b) => ({
      dailyCost: acc.dailyCost + b.dailyCost,
      monthlyCost: acc.monthlyCost + b.monthlyCost,
      projectedCost: acc.projectedCost + b.projectedCost,
      savings: acc.savings + b.savings
    }),
    { dailyCost: 0, monthlyCost: 0, projectedCost: 0, savings: 0 }
  );

  // Month-over-month change from the trend pivot.
  let changePct = 0;
  if (trends.length >= 2) {
    const sum = (m) => (m.aws || 0) + (m.azure || 0) + (m.gcp || 0);
    changePct = computeChangePct(sum(trends[trends.length - 1]), sum(trends[trends.length - 2]));
  }

  const usageShare = aggregateUsageShare(
    breakdown.reduce((a, b) => ({ ...a, [b.provider]: b.monthlyCost }), {})
  );

  return { currency: 'USD', totals, changePct, breakdown, usageShare, trends };
}

/** Security summary: overall + per-provider latest scores and finding counts. */
export async function getSecuritySummary() {
  const map = await latestScoreByProvider(SecurityReport, 'securityScore', ['riskScore', 'summary']);
  const providers = PROVIDER_VALUES.map((key) => ({
    provider: key,
    name: PROVIDER_LABELS[key],
    securityScore: map[key]?.score ?? null,
    riskScore: map[key]?.riskScore ?? null,
    findings: map[key]?.summary ?? null
  }));
  const scored = providers.filter((p) => typeof p.securityScore === 'number');
  const overallSecurity = scored.length
    ? round(scored.reduce((s, p) => s + p.securityScore, 0) / scored.length)
    : null;
  const overallRisk = scored.length
    ? round(scored.reduce((s, p) => s + (p.riskScore || 0), 0) / scored.length)
    : null;
  return { overallSecurity, overallRisk, providers };
}

/** Compliance summary: overall + per-provider latest framework scores. */
export async function getComplianceSummary() {
  const rows = await ComplianceReport.aggregate([
    { $match: NOT_DELETED },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { provider: '$provider', framework: '$framework' },
        complianceScore: { $first: '$complianceScore' },
        summary: { $first: '$summary' }
      }
    }
  ]);
  const reports = rows.map((r) => ({
    provider: r._id.provider,
    framework: r._id.framework,
    complianceScore: r.complianceScore,
    summary: r.summary
  }));
  const overall = reports.length
    ? round(reports.reduce((s, r) => s + (r.complianceScore || 0), 0) / reports.length)
    : null;
  return { overall, reports };
}

/** provider -> most common region (falls back to a default). */
async function regionByProvider() {
  const rows = await CloudResource.aggregate([
    { $match: NOT_DELETED },
    { $group: { _id: { provider: '$provider', region: '$region' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const map = {};
  for (const r of rows) {
    if (!map[r._id.provider]) map[r._id.provider] = r._id.region;
  }
  return map;
}

/** Provider status cards (status, health, active deployments, running containers). */
export async function getProviderCards() {
  const [health, deployMap, containerMap, regionMap] = await Promise.all([
    getHealthScore(),
    deploymentStatusByProvider(),
    runningContainersByProvider(),
    regionByProvider()
  ]);

  return health.providers.map((p) => {
    const counts = deployMap[p.key] || {};
    const activeDeployments =
      (counts[DEPLOYMENT_STATUS.SUCCESS] || 0) + (counts[DEPLOYMENT_STATUS.IN_PROGRESS] || 0);
    return {
      key: p.key,
      name: p.name,
      region: regionMap[p.key] || PROVIDER_DEFAULT_REGIONS[p.key],
      status: p.status,
      healthScore: p.healthScore,
      activeDeployments,
      runningContainers: containerMap[p.key] || 0
    };
  });
}

/** Composite overview consumed by the frontend dashboard. */
export async function getOverview() {
  const [providerCards, deployStats, cost, security, incidents, recent] = await Promise.all([
    getProviderCards(),
    getDeploymentStatistics(),
    getCostSummary(),
    getSecuritySummary(),
    IncidentReport.countDocuments({
      ...NOT_DELETED,
      status: { $in: [INCIDENT_STATUS.OPEN, INCIDENT_STATUS.INVESTIGATING] }
    }),
    deploymentRepository.find(NOT_DELETED, { sort: '-createdAt', limit: 8, populate: 'user' })
  ]);

  const cloudHealthScore = providerCards.length
    ? round(providerCards.reduce((s, p) => s + p.healthScore, 0) / providerCards.length)
    : 0;

  const recentDeployments = recent.map((d) => ({
    id: String(d.id),
    name: d.name,
    provider: d.provider,
    type: d.type,
    status: d.status,
    version: d.version,
    user: d.user?.name || 'Unknown',
    createdAt: d.createdAt
  }));

  return {
    providers: providerCards,
    summary: {
      activeDeployments: deployStats.active,
      runningContainers: providerCards.reduce((s, p) => s + p.runningContainers, 0),
      cloudHealthScore,
      monthlyCost: cost.totals.monthlyCost,
      costChangePct: cost.changePct,
      openIncidents: incidents,
      securityScore: security.overallSecurity ?? 0
    },
    recentDeployments
  };
}

/** Composite charts payload consumed by the frontend dashboard. */
export async function getCharts() {
  const [deploymentTrends, cost, resource] = await Promise.all([
    getDeploymentTrends({ days: 7 }),
    getCostSummary(),
    getResourceUtilization()
  ]);
  return {
    deploymentTrends,
    cloudUsage: cost.usageShare,
    resourceUtilization: resource.series,
    costTrends: cost.trends
  };
}

/** Deployment history with pagination/filtering/search (Module 15 preview). */
export async function listDeployments(query = {}) {
  const { page, limit, sort, search, provider, status, type } = query;
  const result = await deploymentRepository.history({
    page,
    limit,
    sort,
    search,
    provider,
    status,
    type
  });
  return {
    ...result,
    results: result.results.map((d) => ({
      id: String(d.id),
      name: d.name,
      provider: d.provider,
      type: d.type,
      status: d.status,
      version: d.version,
      region: d.region,
      user: d.user?.name || 'Unknown',
      createdAt: d.createdAt
    }))
  };
}

export default {
  getHealthScore,
  getDeploymentStatistics,
  getDeploymentTrends,
  getResourceUtilization,
  getCostTrends,
  getCostSummary,
  getSecuritySummary,
  getComplianceSummary,
  getProviderCards,
  getOverview,
  getCharts,
  listDeployments
};
