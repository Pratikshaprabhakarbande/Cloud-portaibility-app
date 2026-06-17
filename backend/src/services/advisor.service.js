/**
 * AI Cloud Advisor service.
 * Builds a live context snapshot from the dashboard + security services, runs
 * the selected advisor engine, and persists the result to AIRecommendation.
 */
import { getAdvisor } from '../ai/advisor.engine.js';
import { AIRecommendation } from '../models/index.js';
import {
  getOverview,
  getCostSummary,
  getResourceUtilization,
  getDeploymentStatistics
} from './dashboard.service.js';
import { getRiskScore } from './security.service.js';
import { RECOMMENDATION_TYPES, RECOMMENDATION_TYPE_VALUES } from '../config/constants.js';

/**
 * Generate advice for a provider scope and persist it.
 * @param {object} opts
 * @param {string} [opts.scope] provider scope (aws|azure|gcp|multi-cloud)
 * @param {string} [opts.type]  recommendation type (defaults to cost_optimization)
 * @param {object} opts.user    authenticated user
 */
export async function generateAdvice({ scope, type, user } = {}) {
  const [overview, cost, resources, deployments, risk] = await Promise.all([
    getOverview(scope),
    getCostSummary(scope),
    getResourceUtilization(scope),
    getDeploymentStatistics(scope),
    getRiskScore()
  ]);

  const advisor = getAdvisor();
  const result = await advisor.advise({ overview, cost, resources, deployments, security: { risk } });

  const recType = RECOMMENDATION_TYPE_VALUES.includes(type) ? type : RECOMMENDATION_TYPES.COST_OPTIMIZATION;

  const saved = await AIRecommendation.create({
    type: recType,
    title: `Cloud Advisor — ${scope || 'multi-cloud'}`,
    inputs: { scope: scope || 'multi-cloud' },
    content: result.summary,
    costEstimate: result.costEstimate,
    securityRecommendations: result.securityRecommendations,
    scalabilityRecommendations: result.scalabilityRecommendations,
    aiSource: result.source,
    model: result.model,
    user: user.id ?? user._id,
    createdBy: user.id ?? user._id,
    ownerRole: user.role
  });

  return {
    id: String(saved.id),
    scope: scope || 'multi-cloud',
    engine: advisor.describe(),
    summary: result.summary,
    recommendations: result.recommendations,
    costOptimization: result.costOptimization,
    securityRecommendations: result.securityRecommendations,
    resourceOptimization: result.scalabilityRecommendations,
    deployment: result.deployment,
    infraHealthInsights: result.infraHealthInsights,
    createdAt: saved.createdAt
  };
}

/** Paginated history of generated recommendations. */
export async function getRecommendations({ page = 1, limit = 20, type } = {}) {
  const filter = {};
  if (type) filter.type = type;
  const result = await AIRecommendation.paginate(filter, { page, limit, sort: '-createdAt' });
  return {
    ...result,
    results: result.results.map((r) => ({
      id: String(r.id),
      type: r.type,
      title: r.title,
      summary: r.content,
      aiSource: r.aiSource,
      model: r.model,
      createdAt: r.createdAt
    }))
  };
}

export default { generateAdvice, getRecommendations };
