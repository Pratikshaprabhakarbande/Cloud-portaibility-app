/**
 * MultiCloudProvider — composite adapter that fans out to a set of single
 * providers and merges their results into an aggregated view. Implements the
 * same interface so callers can treat "multi-cloud" like any other provider.
 */
import CloudProvider from './CloudProvider.js';
import { round } from '../services/dashboard.helpers.js';

const mergeCountMaps = (maps) =>
  maps.reduce((acc, m) => {
    for (const [k, v] of Object.entries(m || {})) acc[k] = (acc[k] || 0) + v;
    return acc;
  }, {});

export default class MultiCloudProvider extends CloudProvider {
  /** @param {CloudProvider[]} providers single-provider adapters to aggregate */
  constructor(providers) {
    super({ provider: 'multi-cloud', mode: 'composite' });
    this.providers = providers;
  }

  async getResources() {
    const results = await Promise.all(this.providers.map((p) => p.getResources()));
    return {
      provider: this.provider,
      total: results.reduce((s, r) => s + r.total, 0),
      running: results.reduce((s, r) => s + r.running, 0),
      runningContainers: results.reduce((s, r) => s + (r.runningContainers || 0), 0),
      byType: mergeCountMaps(results.map((r) => r.byType)),
      byStatus: mergeCountMaps(results.map((r) => r.byStatus)),
      byProvider: Object.fromEntries(results.map((r) => [r.provider, r.total])),
      items: results.flatMap((r) => r.items)
    };
  }

  async getDeployments() {
    const results = await Promise.all(this.providers.map((p) => p.getDeployments()));
    const recent = results
      .flatMap((r) => r.recent)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
    return {
      provider: this.provider,
      total: results.reduce((s, r) => s + r.total, 0),
      active: results.reduce((s, r) => s + r.active, 0),
      byStatus: mergeCountMaps(results.map((r) => r.byStatus)),
      byProvider: Object.fromEntries(results.map((r) => [r.provider, r.total])),
      recent
    };
  }

  async getDeploymentTrends(opts) {
    const results = await Promise.all(this.providers.map((p) => p.getDeploymentTrends(opts)));
    // Merge by date across providers.
    const byDate = new Map();
    for (const series of results) {
      for (const pt of series) {
        const cur = byDate.get(pt.date) || { date: pt.date, success: 0, failed: 0 };
        cur.success += pt.success;
        cur.failed += pt.failed;
        byDate.set(pt.date, cur);
      }
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCostSummary() {
    const results = await Promise.all(this.providers.map((p) => p.getCostSummary()));
    const byMonth = new Map();
    for (const r of results) {
      for (const t of r.trends) {
        const cur = byMonth.get(t.month) || { month: t.month, cost: 0 };
        cur.cost += t.cost;
        byMonth.set(t.month, cur);
      }
    }
    return {
      provider: this.provider,
      currency: 'USD',
      dailyCost: round(results.reduce((s, r) => s + r.dailyCost, 0)),
      monthlyCost: round(results.reduce((s, r) => s + r.monthlyCost, 0)),
      projectedCost: round(results.reduce((s, r) => s + r.projectedCost, 0)),
      savings: round(results.reduce((s, r) => s + r.savings, 0)),
      byProvider: Object.fromEntries(results.map((r) => [r.provider, r.monthlyCost])),
      trends: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month))
    };
  }

  async getSecurityFindings() {
    const results = await Promise.all(this.providers.map((p) => p.getSecurityFindings()));
    const scored = results.filter((r) => typeof r.securityScore === 'number');
    return {
      provider: this.provider,
      securityScore: scored.length ? round(scored.reduce((s, r) => s + r.securityScore, 0) / scored.length) : null,
      riskScore: scored.length ? round(scored.reduce((s, r) => s + (r.riskScore || 0), 0) / scored.length) : null,
      byProvider: results.map((r) => ({ provider: r.provider, securityScore: r.securityScore, riskScore: r.riskScore })),
      findings: results.flatMap((r) => (r.findings || []).map((f) => ({ ...f, provider: r.provider })))
    };
  }

  async getComplianceStatus() {
    const results = await Promise.all(this.providers.map((p) => p.getComplianceStatus()));
    const scored = results.filter((r) => typeof r.overall === 'number');
    return {
      provider: this.provider,
      overall: scored.length ? round(scored.reduce((s, r) => s + r.overall, 0) / scored.length) : null,
      byProvider: results.map((r) => ({ provider: r.provider, overall: r.overall, reports: r.reports }))
    };
  }

  async getHealthScore() {
    const results = await Promise.all(this.providers.map((p) => p.getHealthScore()));
    const overall = results.length ? round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
    return {
      provider: this.provider,
      score: overall,
      status: results.length ? results.reduce((best, r) => (r.score < best ? r.score : best), 100) >= 70 ? 'operational' : 'degraded' : 'unknown',
      providers: results
    };
  }
}
