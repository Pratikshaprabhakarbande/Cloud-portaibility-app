/**
 * DbCloudProvider — concrete adapter backed by the Phase 3 MongoDB models,
 * scoped to a single provider. Real cloud-SDK adapters (AWS/Azure/GCP) extend
 * this and will override individual methods to call live APIs when credentials
 * are present; until then they serve provider-scoped data from the database.
 *
 * All public methods are memoized via the TTL cache to reduce repeated work.
 */
import CloudProvider from './CloudProvider.js';
import { withCache } from './cache.js';
import {
  Deployment,
  CloudResource,
  SecurityReport,
  ComplianceReport,
  CostReport
} from '../models/index.js';
import deploymentRepository from '../repositories/DeploymentRepository.js';
import {
  DEPLOYMENT_STATUS,
  RESOURCE_STATUS,
  RESOURCE_TYPES
} from '../config/constants.js';
import {
  computeSuccessRate,
  computeProviderHealth,
  statusFromHealth,
  reshapeDeploymentTrends,
  round
} from '../services/dashboard.helpers.js';

const NOT_DELETED = { isDeleted: { $ne: true } };
const toMap = (rows) => rows.reduce((a, r) => ({ ...a, [r._id]: r.count }), {});

export default class DbCloudProvider extends CloudProvider {
  /** Cache key helper, namespaced by provider + mode. */
  _key(method, suffix = '') {
    return `${this.provider}:${this.mode}:${method}${suffix}`;
  }

  async getResources() {
    return withCache(this._key('getResources'), async () => {
      const match = { ...NOT_DELETED, provider: this.provider };
      const [byType, byStatus, total, running, runningContainers, items] = await Promise.all([
        CloudResource.aggregate([{ $match: match }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
        CloudResource.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        CloudResource.countDocuments(match),
        CloudResource.countDocuments({ ...match, status: RESOURCE_STATUS.RUNNING }),
        CloudResource.countDocuments({
          ...match,
          status: RESOURCE_STATUS.RUNNING,
          type: { $in: [RESOURCE_TYPES.CONTAINER, RESOURCE_TYPES.KUBERNETES] }
        }),
        CloudResource.find(match).sort('-lastSyncedAt').limit(50)
      ]);
      return {
        provider: this.provider,
        total,
        running,
        runningContainers,
        byType: toMap(byType),
        byStatus: toMap(byStatus),
        items: items.map((r) => ({
          id: String(r.id),
          resourceId: r.resourceId,
          name: r.name,
          type: r.type,
          service: r.service,
          status: r.status,
          region: r.region,
          monthlyCost: r.monthlyCost,
          lockInRisk: r.lockInRisk
        }))
      };
    });
  }

  async getDeployments() {
    return withCache(this._key('getDeployments'), async () => {
      const match = { ...NOT_DELETED, provider: this.provider };
      const [byStatusRows, total, recent] = await Promise.all([
        Deployment.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Deployment.countDocuments(match),
        deploymentRepository.find(match, { sort: '-createdAt', limit: 8, populate: 'user' })
      ]);
      const byStatus = toMap(byStatusRows);
      const active =
        (byStatus[DEPLOYMENT_STATUS.SUCCESS] || 0) + (byStatus[DEPLOYMENT_STATUS.IN_PROGRESS] || 0);
      return {
        provider: this.provider,
        total,
        active,
        byStatus,
        byProvider: { [this.provider]: total },
        recent: recent.map((d) => ({
          id: String(d.id),
          name: d.name,
          provider: d.provider,
          type: d.type,
          status: d.status,
          version: d.version,
          user: d.user?.name || 'Unknown',
          createdAt: d.createdAt
        }))
      };
    });
  }

  async getDeploymentTrends({ days = 7 } = {}) {
    return withCache(this._key('getDeploymentTrends', `:${days}`), async () => {
      const rows = await deploymentRepository.trends({ days, provider: this.provider });
      return reshapeDeploymentTrends(rows, days);
    });
  }

  async getCostSummary() {
    return withCache(this._key('getCostSummary'), async () => {
      const match = { ...NOT_DELETED, provider: this.provider };
      const [latest, trendRows] = await Promise.all([
        CostReport.findOne(match).sort({ 'period.date': -1, createdAt: -1 }),
        CostReport.aggregate([
          { $match: match },
          { $group: { _id: '$period.month', cost: { $sum: '$monthlyCost' } } },
          { $sort: { _id: 1 } }
        ])
      ]);
      return {
        provider: this.provider,
        currency: latest?.currency || 'USD',
        dailyCost: round(latest?.dailyCost || 0),
        monthlyCost: round(latest?.monthlyCost || 0),
        projectedCost: round(latest?.projectedCost || 0),
        savings: round(latest?.totalPotentialSavings || 0),
        trends: trendRows.map((r) => ({ month: r._id, cost: round(r.cost) }))
      };
    });
  }

  async getSecurityFindings() {
    return withCache(this._key('getSecurityFindings'), async () => {
      const report = await SecurityReport.findOne({ ...NOT_DELETED, provider: this.provider }).sort('-createdAt');
      return {
        provider: this.provider,
        securityScore: report?.securityScore ?? null,
        riskScore: report?.riskScore ?? null,
        summary: report?.summary ?? null,
        findings: (report?.findings || []).map((f) => ({
          title: f.title,
          category: f.category,
          severity: f.severity,
          resourceId: f.resourceId,
          recommendation: f.recommendation
        }))
      };
    });
  }

  async getComplianceStatus() {
    return withCache(this._key('getComplianceStatus'), async () => {
      const rows = await ComplianceReport.aggregate([
        { $match: { ...NOT_DELETED, provider: this.provider } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$framework',
            complianceScore: { $first: '$complianceScore' },
            summary: { $first: '$summary' }
          }
        }
      ]);
      const reports = rows.map((r) => ({
        framework: r._id,
        complianceScore: r.complianceScore,
        summary: r.summary
      }));
      const overall = reports.length
        ? round(reports.reduce((s, r) => s + (r.complianceScore || 0), 0) / reports.length)
        : null;
      return { provider: this.provider, overall, reports };
    });
  }

  async getHealthScore() {
    return withCache(this._key('getHealthScore'), async () => {
      const [deployments, security, compliance] = await Promise.all([
        this.getDeployments(),
        this.getSecurityFindings(),
        this.getComplianceStatus()
      ]);
      const successRate = computeSuccessRate(deployments.byStatus);
      const securityScore = security.securityScore;
      const complianceScore = compliance.overall;
      const score = computeProviderHealth({ successRate, securityScore, complianceScore });
      return {
        provider: this.provider,
        score,
        status: statusFromHealth(score),
        metrics: { successRate, securityScore, complianceScore }
      };
    });
  }
}
