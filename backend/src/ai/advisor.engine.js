/**
 * AI Cloud Advisor engine abstraction.
 *
 * `AdvisorEngine` is the contract; `RuleBasedAdvisor` is the default,
 * deterministic, zero-cost implementation that turns live platform data into
 * actionable recommendations. `BedrockAdvisor` is an LLM-ready stub that future
 * work can complete (Amazon Bedrock / Claude) without changing callers.
 *
 * `getAdvisor()` selects the engine from configuration and ALWAYS falls back to
 * the rule-based engine so the feature never breaks.
 */
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { AI_SOURCES } from '../config/constants.js';
import { getRegisteredAdvisor } from './hooks.js';

const rec = (category, title, detail, extra = {}) => ({ category, title, detail, ...extra });

export class AdvisorEngine {
  // eslint-disable-next-line class-methods-use-this
  async advise() {
    throw new Error('advise() not implemented');
  }
  // eslint-disable-next-line class-methods-use-this
  describe() {
    return { engine: 'abstract' };
  }
}

/**
 * Deterministic, data-driven advisor. Consumes a `context` snapshot
 * (overview, cost, security, resources, deployments) and emits recommendations
 * across cost, security, resource, deployment, and infra-health categories.
 */
export class RuleBasedAdvisor extends AdvisorEngine {
  describe() {
    return { engine: 'rule-based', model: 'rule-based-advisor-v1', source: AI_SOURCES.MOCK };
  }

  // eslint-disable-next-line class-methods-use-this
  async advise(context = {}) {
    const { overview = {}, cost = {}, security = {}, resources = {}, deployments = {} } = context;
    const summary = overview.summary || {};
    const costOptimization = [];
    const securityRecs = [];
    const resourceOptimization = [];
    const deployment = [];
    const infraHealthInsights = [];

    // ---- Cost optimization ----
    const breakdown = cost.breakdown || [];
    const topProvider = [...breakdown].sort((a, b) => (b.monthlyCost || 0) - (a.monthlyCost || 0))[0];
    if (topProvider && topProvider.monthlyCost > 0) {
      costOptimization.push(
        rec('cost_optimization', `Right-size ${topProvider.name} workloads`,
          `${topProvider.name} is your highest monthly spend ($${topProvider.monthlyCost}). Review instance sizing and idle resources.`,
          { estimatedMonthlySavings: Math.round(topProvider.monthlyCost * 0.15) })
      );
    }
    if ((cost.totals?.savings || 0) > 0) {
      costOptimization.push(
        rec('cost_optimization', 'Apply identified savings',
          `Detected ~$${cost.totals.savings}/mo in potential savings (commitments, storage lifecycle, right-sizing).`,
          { estimatedMonthlySavings: cost.totals.savings })
      );
    }
    if (costOptimization.length === 0) {
      costOptimization.push(rec('cost_optimization', 'Costs look optimized', 'No high-cost outliers detected in the current data.'));
    }

    // ---- Security ----
    const risk = security.risk || {};
    if ((risk.inputs?.failedLogins24h || 0) > 0) {
      securityRecs.push(`Enable account lockout/MFA — ${risk.inputs.failedLogins24h} failed logins in the last 24h.`);
    }
    if ((risk.inputs?.criticalFindings || 0) > 0 || (risk.inputs?.highFindings || 0) > 0) {
      securityRecs.push(`Remediate ${risk.inputs.criticalFindings || 0} critical / ${risk.inputs.highFindings || 0} high findings (public buckets, weak IAM, open ports).`);
    }
    if ((risk.inputs?.openIncidents || 0) > 0) {
      securityRecs.push(`Triage ${risk.inputs.openIncidents} open incident(s).`);
    }
    if (securityRecs.length === 0) securityRecs.push('No urgent security issues detected; maintain least-privilege IAM and encryption-at-rest.');

    // ---- Resource optimization ----
    const totals = resources.totals || {};
    if (totals.total > 0 && totals.running < totals.total) {
      resourceOptimization.push(
        rec('scalability', 'Clean up idle resources',
          `${totals.total - totals.running} of ${totals.total} resources are not running — terminate or schedule them to cut waste.`)
      );
    }
    resourceOptimization.push(rec('scalability', 'Enable autoscaling', 'Scale on CPU + request rate to match demand and avoid over-provisioning.'));

    // ---- Deployment ----
    if (typeof deployments.successRate === 'number' && deployments.successRate < 90) {
      deployment.push(
        rec('architecture', 'Improve deployment reliability',
          `Deployment success rate is ${deployments.successRate}%. Add pre-deploy checks, canary releases, and automated rollback.`)
      );
    } else {
      deployment.push(rec('architecture', 'Adopt progressive delivery', 'Use canary/blue-green deploys with automated rollback to reduce risk.'));
    }

    // ---- Infra health insights ----
    (overview.providers || []).forEach((p) => {
      if (p.status !== 'operational') {
        infraHealthInsights.push(`${p.name}: status ${p.status} (health ${p.healthScore}). Investigate failing checks/deployments.`);
      }
    });
    if (infraHealthInsights.length === 0) infraHealthInsights.push('All providers operational.');

    const all = [...costOptimization, ...resourceOptimization, ...deployment];
    return {
      source: AI_SOURCES.MOCK,
      model: 'rule-based-advisor-v1',
      summary:
        `Health ${summary.cloudHealthScore ?? 'n/a'} · risk ${risk.riskScore ?? 'n/a'} · monthly cost $${cost.totals?.monthlyCost ?? 0}. ` +
        `${all.length} optimization items, ${securityRecs.length} security recommendations.`,
      recommendations: all,
      costOptimization,
      securityRecommendations: securityRecs,
      scalabilityRecommendations: resourceOptimization.map((r) => r.title),
      deployment,
      infraHealthInsights,
      costEstimate: cost.totals || null
    };
  }
}

/** LLM-ready stub. Not selected unless explicitly configured + credentialed. */
export class BedrockAdvisor extends AdvisorEngine {
  constructor() {
    super();
    this.modelId = env.ai?.bedrockModelId;
  }
  describe() {
    return { engine: 'bedrock', model: this.modelId, source: AI_SOURCES.BEDROCK, status: 'stub' };
  }
  // eslint-disable-next-line class-methods-use-this
  async advise() {
    // Future: call Amazon Bedrock with a structured prompt + parse JSON.
    throw new Error('Bedrock advisor is not yet wired; falling back to rule-based.');
  }
}

/**
 * Select the advisor engine. Defaults to rule-based; only uses Bedrock when
 * explicitly enabled AND configured. Always safe — callers get a working engine.
 */
export function getAdvisor() {
  const provider = env.ai?.provider || 'rule';

  // Extension hook: a custom engine registered under this provider name wins.
  const custom = getRegisteredAdvisor(provider);
  if (custom) return custom;

  if (provider === 'bedrock' && !env.demoMode && env.ai?.bedrockEnabled) {
    try {
      return new BedrockAdvisor();
    } catch (err) {
      logger.warn(`[ai] bedrock advisor unavailable, using rule-based: ${err.message}`);
    }
  }
  return new RuleBasedAdvisor();
}

export default { getAdvisor, RuleBasedAdvisor, BedrockAdvisor, AdvisorEngine };
