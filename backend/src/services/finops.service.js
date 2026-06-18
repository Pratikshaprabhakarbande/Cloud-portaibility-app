/**
 * FinOps Optimizer service.
 * Cost summary + rule-based optimization recommendations + utilization analysis,
 * derived from the cloud adapters (cost + resources). `analyze` persists a
 * CostReport (aggregated by the dashboard cost-summary).
 */
import providerFactory from '../cloud-adapters/ProviderFactory.js';
import { CostReport } from '../models/index.js';
import { getCostSummary as dashboardCostSummary, getResourceUtilization } from './dashboard.service.js';
import { round } from './dashboard.helpers.js';

/** Cost summary for a scope (delegates to the dashboard aggregation). */
export async function getSummary(scope) {
  return dashboardCostSummary(scope);
}

/** Build rule-based cost recommendations + utilization analysis for a scope. */
export async function getRecommendations(scope) {
  const [cost, resources] = await Promise.all([dashboardCostSummary(scope), getResourceUtilization(scope)]);
  const recommendations = [];

  const top = [...(cost.breakdown || [])].sort((a, b) => (b.monthlyCost || 0) - (a.monthlyCost || 0))[0];
  if (top && top.monthlyCost > 0) {
    recommendations.push({
      title: `Right-size ${top.name} workloads`,
      description: `${top.name} is the highest monthly spend ($${top.monthlyCost}). Review instance sizing and idle compute.`,
      estimatedMonthlySavings: round(top.monthlyCost * 0.15)
    });
  }
  const totalMonthly = cost.totals?.monthlyCost || 0;
  if (totalMonthly >= 50) {
    recommendations.push({
      title: 'Apply commitment discounts',
      description: 'Use Savings Plans / Reserved Instances / Committed Use Discounts for steady-state workloads.',
      estimatedMonthlySavings: round(totalMonthly * 0.1)
    });
  }
  const totals = resources.totals || { total: 0, running: 0 };
  if (totals.total > totals.running) {
    recommendations.push({
      title: 'Terminate or schedule idle resources',
      description: `${totals.total - totals.running} of ${totals.total} resources are not running. Remove or auto-schedule them.`,
      estimatedMonthlySavings: round((totals.total - totals.running) * 8)
    });
  }
  recommendations.push({
    title: 'Storage lifecycle policies',
    description: 'Transition cold objects to infrequent-access/archive tiers and expire stale data.',
    estimatedMonthlySavings: 5
  });

  const utilization = {
    totalResources: totals.total,
    runningResources: totals.running,
    idleResources: Math.max(0, totals.total - totals.running),
    runningRatio: totals.total ? round((totals.running / totals.total) * 100) : 0
  };
  const totalPotentialSavings = recommendations.reduce((s, r) => s + (r.estimatedMonthlySavings || 0), 0);

  return { scope: scope || 'multi-cloud', totals: cost.totals, utilization, recommendations, totalPotentialSavings };
}

/** Generate recommendations for a single provider and persist a CostReport. */
export async function analyze({ provider, user }) {
  const adapter = providerFactory.get(provider);
  const [cost, resources] = await Promise.all([adapter.getCostSummary(), adapter.getResources()]);
  const recs = await getRecommendations(provider);

  const breakdown = (cost.trends || []).length
    ? [{ service: 'total', cost: round(cost.monthlyCost || 0), percentage: 100 }]
    : [];

  const report = await CostReport.create({
    provider,
    currency: cost.currency || 'USD',
    dailyCost: round(cost.dailyCost || 0),
    monthlyCost: round(cost.monthlyCost || 0),
    projectedCost: round(cost.projectedCost || 0),
    breakdown,
    recommendations: recs.recommendations,
    user: user.id ?? user._id,
    createdBy: user.id ?? user._id,
    ownerRole: user.role
  });

  return {
    id: String(report.id),
    provider,
    monthlyCost: report.monthlyCost,
    projectedCost: report.projectedCost,
    totalPotentialSavings: report.totalPotentialSavings,
    recommendations: report.recommendations,
    utilization: recs.utilization,
    resourceCount: resources.total,
    createdAt: report.createdAt
  };
}

/** Paginated FinOps (cost) report history. */
export async function getReports({ page, limit, provider } = {}) {
  const filter = {};
  if (provider) filter.provider = provider;
  const result = await CostReport.paginate(filter, { page, limit, sort: '-createdAt' });
  return {
    ...result,
    results: result.results.map((r) => ({
      id: String(r.id),
      provider: r.provider,
      monthlyCost: r.monthlyCost,
      projectedCost: r.projectedCost,
      totalPotentialSavings: r.totalPotentialSavings,
      createdAt: r.createdAt
    }))
  };
}

export default { getSummary, getRecommendations, analyze, getReports };
