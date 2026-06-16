/**
 * Dashboard service — orchestrates dashboard responses by delegating all
 * provider-scoped data to the Cloud Adapter Layer (Module 3).
 *
 * A `scope` selects the provider adapter:
 *   'aws' | 'azure' | 'gcp'  -> that single provider
 *   'multi-cloud' (default)  -> aggregated across all providers
 *   'mock'                   -> synthetic demo data
 *
 * Pure shaping/scoring helpers live in dashboard.helpers.js (unit-tested).
 */
import providerFactory from '../cloud-adapters/ProviderFactory.js';
import deploymentRepository from '../repositories/DeploymentRepository.js';
import { IncidentReport } from '../models/index.js';
import { INCIDENT_STATUS } from '../config/constants.js';
import {
  PROVIDER_LABELS,
  PROVIDER_DEFAULT_REGIONS,
  computeSuccessRate,
  statusFromHealth,
  computeChangePct,
  aggregateUsageShare,
  buildUtilizationSeries,
  round
} from './dashboard.helpers.js';

const NOT_DELETED = { isDeleted: { $ne: true } };

/* --------------------------------- helpers --------------------------------- */

/** Pivot an array of per-provider cost summaries into { month, aws, azure, gcp } rows. */
function pivotCostTrends(perProviderCost) {
  const byMonth = new Map();
  for (const c of perProviderCost) {
    for (const t of c.trends || []) {
      if (!byMonth.has(t.month)) byMonth.set(t.month, { month: t.month, aws: 0, azure: 0, gcp: 0 });
      const row = byMonth.get(t.month);
      if (row[c.provider] !== undefined) row[c.provider] += t.cost;
    }
  }
  return Array.from(byMonth.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
}

const sumMonth = (m) => (m.aws || 0) + (m.azure || 0) + (m.gcp || 0);

/** Count open/investigating incidents for the scope. */
async function countOpenIncidents(scope) {
  const keys = providerFactory.resolveProviders(scope).map((a) => a.provider);
  const match = {
    ...NOT_DELETED,
    status: { $in: [INCIDENT_STATUS.OPEN, INCIDENT_STATUS.INVESTIGATING] }
  };
  if (keys.length === 1) match.provider = keys[0];
  return IncidentReport.countDocuments(match);
}

/* ------------------------------ public methods ----------------------------- */

/** Cloud health score: overall + per-provider breakdown. */
export async function getHealthScore(scope) {
  const adapters = providerFactory.resolveProviders(scope);
  const results = await Promise.all(adapters.map((a) => a.getHealthScore()));
  const providers = results.map((r) => ({
    key: r.provider,
    name: PROVIDER_LABELS[r.provider] || r.provider,
    healthScore: r.score,
    status: r.status,
    metrics: r.metrics
  }));
  const overall = providers.length
    ? round(providers.reduce((s, p) => s + p.healthScore, 0) / providers.length)
    : 0;
  return { overall, status: statusFromHealth(overall), providers };
}

/** Provider status cards (status, health, active deployments, running containers). */
export async function getProviderCards(scope) {
  const adapters = providerFactory.resolveProviders(scope);
  return Promise.all(
    adapters.map(async (adapter) => {
      const [health, deployments, resources] = await Promise.all([
        adapter.getHealthScore(),
        adapter.getDeployments(),
        adapter.getResources()
      ]);
      return {
        key: adapter.provider,
        name: PROVIDER_LABELS[adapter.provider] || adapter.provider,
        region: PROVIDER_DEFAULT_REGIONS[adapter.provider] || 'n/a',
        status: health.status,
        healthScore: health.score,
        activeDeployments: deployments.active,
        runningContainers: resources.runningContainers ?? 0
      };
    })
  );
}

/** Deployment statistics for the scope. */
export async function getDeploymentStatistics(scope) {
  const adapter = providerFactory.get(scope);
  const d = await adapter.getDeployments();
  return {
    total: d.total,
    active: d.active,
    successRate: computeSuccessRate(d.byStatus),
    byStatus: d.byStatus,
    byProvider: d.byProvider || {}
  };
}

/** Deployment trends time series for the scope. */
export async function getDeploymentTrends({ days = 7, provider } = {}) {
  const adapter = providerFactory.get(provider);
  return adapter.getDeploymentTrends({ days });
}

/** Resource inventory aggregates + modeled utilization series. */
export async function getResourceUtilization(scope) {
  const adapter = providerFactory.get(scope);
  const r = await adapter.getResources();
  const runningRatio = r.total > 0 ? r.running / r.total : 0.5;
  return {
    totals: { total: r.total, running: r.running },
    byType: r.byType,
    byStatus: r.byStatus,
    byProvider: r.byProvider || { [adapter.provider]: r.total },
    series: buildUtilizationSeries(runningRatio),
    source: 'modeled',
    note: 'Utilization is modeled from running-resource ratio until Prometheus integration (Phase 11).'
  };
}

/** Cost summary: totals + per-provider breakdown + trends + savings. */
export async function getCostSummary(scope) {
  const adapters = providerFactory.resolveProviders(scope);
  const perCost = await Promise.all(adapters.map((a) => a.getCostSummary()));

  const breakdown = perCost.map((c) => ({
    provider: c.provider,
    name: PROVIDER_LABELS[c.provider] || c.provider,
    dailyCost: c.dailyCost,
    monthlyCost: c.monthlyCost,
    projectedCost: c.projectedCost,
    savings: c.savings
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

  const trends = pivotCostTrends(perCost);
  let changePct = 0;
  if (trends.length >= 2) {
    changePct = computeChangePct(sumMonth(trends[trends.length - 1]), sumMonth(trends[trends.length - 2]));
  }

  const usageShare = aggregateUsageShare(
    breakdown.reduce((a, b) => ({ ...a, [b.provider]: b.monthlyCost }), {})
  );

  return { currency: 'USD', totals, changePct, breakdown, usageShare, trends };
}

/** Security summary across the scope. */
export async function getSecuritySummary(scope) {
  const adapters = providerFactory.resolveProviders(scope);
  const per = await Promise.all(adapters.map((a) => a.getSecurityFindings()));
  const providers = per.map((s) => ({
    provider: s.provider,
    name: PROVIDER_LABELS[s.provider] || s.provider,
    securityScore: s.securityScore,
    riskScore: s.riskScore,
    findings: s.summary
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

/** Compliance summary across the scope. */
export async function getComplianceSummary(scope) {
  const adapters = providerFactory.resolveProviders(scope);
  const per = await Promise.all(adapters.map((a) => a.getComplianceStatus()));
  const reports = per.flatMap((c) =>
    (c.reports || []).map((r) => ({
      provider: c.provider,
      framework: r.framework,
      complianceScore: r.complianceScore,
      summary: r.summary
    }))
  );
  const scored = per.filter((c) => typeof c.overall === 'number');
  const overall = scored.length
    ? round(scored.reduce((s, c) => s + c.overall, 0) / scored.length)
    : null;
  return { overall, reports };
}

/** Composite overview consumed by the frontend dashboard. */
export async function getOverview(scope) {
  const scopeAdapter = providerFactory.get(scope);
  const [cards, deployments, cost, security, incidents] = await Promise.all([
    getProviderCards(scope),
    scopeAdapter.getDeployments(),
    getCostSummary(scope),
    scopeAdapter.getSecurityFindings(),
    countOpenIncidents(scope)
  ]);

  const cloudHealthScore = cards.length
    ? round(cards.reduce((s, p) => s + p.healthScore, 0) / cards.length)
    : 0;

  return {
    providers: cards,
    summary: {
      activeDeployments: deployments.active,
      runningContainers: cards.reduce((s, p) => s + p.runningContainers, 0),
      cloudHealthScore,
      monthlyCost: cost.totals.monthlyCost,
      costChangePct: cost.changePct,
      openIncidents: incidents,
      securityScore: security.securityScore ?? 0
    },
    recentDeployments: deployments.recent
  };
}

/** Composite charts payload consumed by the frontend dashboard. */
export async function getCharts(scope) {
  const scopeAdapter = providerFactory.get(scope);
  const adapters = providerFactory.resolveProviders(scope);
  const [deploymentTrends, resources, perCost] = await Promise.all([
    scopeAdapter.getDeploymentTrends({ days: 7 }),
    scopeAdapter.getResources(),
    Promise.all(adapters.map((a) => a.getCostSummary()))
  ]);

  const runningRatio = resources.total > 0 ? resources.running / resources.total : 0.5;
  const cloudUsage = aggregateUsageShare(
    perCost.reduce((a, c) => ({ ...a, [c.provider]: c.monthlyCost }), {})
  );

  return {
    deploymentTrends,
    cloudUsage,
    resourceUtilization: buildUtilizationSeries(runningRatio),
    costTrends: pivotCostTrends(perCost)
  };
}

/** Deployment history with pagination/filtering/search (Module 15 preview). */
export async function listDeployments(query = {}) {
  const { page, limit, sort, search, provider, status, type } = query;
  const result = await deploymentRepository.history({ page, limit, sort, search, provider, status, type });
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
  getProviderCards,
  getDeploymentStatistics,
  getDeploymentTrends,
  getResourceUtilization,
  getCostSummary,
  getSecuritySummary,
  getComplianceSummary,
  getOverview,
  getCharts,
  listDeployments
};
