/**
 * MockProvider — returns deterministic synthetic data without touching the
 * database. Useful for Demo Mode with an empty database, local UI work, and
 * fast/offline tests. Values are stable (seeded by provider key), not random.
 */
import CloudProvider from './../CloudProvider.js';
import { statusFromHealth } from '../../services/dashboard.helpers.js';

const SEED = { mock: 1, aws: 2, azure: 3, gcp: 4 };

export default class MockProvider extends CloudProvider {
  constructor(provider = 'mock') {
    super({ provider, mode: 'mock' });
    this.seed = SEED[provider] || 1;
  }

  // eslint-disable-next-line class-methods-use-this
  async getResources() {
    const s = this.seed;
    return {
      provider: this.provider,
      total: 6 + s,
      running: 4 + s,
      runningContainers: 1 + s,
      byType: { compute: 2, storage: 1, database: 1, kubernetes: 1 + s, network: 1 },
      byStatus: { running: 4 + s, stopped: 1, pending: 1 },
      items: [
        { id: `mock-${this.provider}-1`, resourceId: `res-${this.provider}-1`, name: 'demo-compute', type: 'compute', service: 'VM', status: 'running', region: 'us-east-1', monthlyCost: 0, lockInRisk: 'low' },
        { id: `mock-${this.provider}-2`, resourceId: `res-${this.provider}-2`, name: 'demo-bucket', type: 'storage', service: 'ObjectStore', status: 'running', region: 'us-east-1', monthlyCost: 1.2, lockInRisk: 'medium' }
      ]
    };
  }

  async getDeployments() {
    const s = this.seed;
    const byStatus = { success: 5 + s, in_progress: 1, failed: 1, pending: 1 };
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return {
      provider: this.provider,
      total,
      active: byStatus.success + byStatus.in_progress,
      byStatus,
      byProvider: { [this.provider]: total },
      recent: [
        { id: `mock-dep-${this.provider}-1`, name: 'demo-api', provider: this.provider, type: 'docker', status: 'success', version: 3, user: 'Demo User', createdAt: new Date().toISOString() },
        { id: `mock-dep-${this.provider}-2`, name: 'demo-web', provider: this.provider, type: 'terraform', status: 'in_progress', version: 1, user: 'Demo User', createdAt: new Date().toISOString() }
      ]
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async getDeploymentTrends({ days = 7 } = {}) {
    const now = new Date();
    return Array.from({ length: days }).map((_, i) => {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - (days - 1 - i));
      return { date: d.toISOString().slice(0, 10), success: ((i + this.seed) % 5) + 2, failed: i % 2 };
    });
  }

  async getCostSummary() {
    const base = 80 + this.seed * 20;
    return {
      provider: this.provider,
      currency: 'USD',
      dailyCost: Math.round((base / 30) * 10) / 10,
      monthlyCost: base,
      projectedCost: Math.round(base * 1.05),
      savings: 10 + this.seed,
      trends: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => ({ month: `2026-0${i + 1}`, cost: base - 20 + i * 5 }))
    };
  }

  async getSecurityFindings() {
    const securityScore = 70 + this.seed * 5;
    return {
      provider: this.provider,
      securityScore,
      riskScore: 100 - securityScore,
      summary: { total: 3, critical: 0, high: 1, medium: 1, low: 1 },
      findings: [
        { title: 'Public storage bucket', category: 'public_bucket', severity: 'high', resourceId: 'demo-bucket', recommendation: 'Disable public access.' },
        { title: 'Overly permissive role', category: 'weak_iam', severity: 'medium', resourceId: 'demo-role', recommendation: 'Apply least privilege.' }
      ]
    };
  }

  async getComplianceStatus() {
    const score = 75 + this.seed * 3;
    return {
      provider: this.provider,
      overall: score,
      reports: [{ framework: 'CIS', complianceScore: score, summary: { total: 10, passed: Math.round(score / 10), failed: 2, warnings: 1 } }]
    };
  }

  async getHealthScore() {
    const [d, sec, comp] = await Promise.all([
      this.getDeployments(),
      this.getSecurityFindings(),
      this.getComplianceStatus()
    ]);
    const successRate = Math.round((d.byStatus.success / (d.byStatus.success + d.byStatus.failed)) * 100);
    const score = Math.round(successRate * 0.4 + sec.securityScore * 0.3 + comp.overall * 0.3);
    return {
      provider: this.provider,
      score,
      status: statusFromHealth(score),
      metrics: { successRate, securityScore: sec.securityScore, complianceScore: comp.overall }
    };
  }
}
