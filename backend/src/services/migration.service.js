/**
 * Migration Advisor service.
 * Cross-cloud migration planning, service-equivalence comparison, risk/downtime
 * estimation, and cost projection. `plan` persists a MigrationReport.
 */
import providerFactory from '../cloud-adapters/ProviderFactory.js';
import { MigrationReport } from '../models/index.js';
import { PROVIDER_VALUES, MIGRATION_STATUS, SEVERITY } from '../config/constants.js';
import { round } from './dashboard.helpers.js';

const LABEL = { aws: 'AWS', azure: 'Azure', gcp: 'GCP' };

// Service equivalence matrix across providers.
const EQUIVALENTS = {
  compute: { aws: 'EC2', azure: 'Virtual Machines', gcp: 'Compute Engine' },
  storage: { aws: 'S3', azure: 'Blob Storage', gcp: 'Cloud Storage' },
  database: { aws: 'RDS / DynamoDB', azure: 'Azure SQL / Cosmos DB', gcp: 'Cloud SQL / Firestore' },
  serverless: { aws: 'Lambda', azure: 'Functions', gcp: 'Cloud Functions' },
  kubernetes: { aws: 'EKS', azure: 'AKS', gcp: 'GKE' },
  network: { aws: 'VPC', azure: 'VNet', gcp: 'VPC' }
};

/** Build the source→target service mapping table. */
export function compare(source, target) {
  if (!PROVIDER_VALUES.includes(source) || !PROVIDER_VALUES.includes(target)) {
    throw Object.assign(new Error('Invalid providers'), { statusCode: 400 });
  }
  const mappings = Object.entries(EQUIVALENTS).map(([category, m]) => ({
    category,
    source: m[source],
    target: m[target]
  }));
  return {
    source,
    target,
    sourceName: LABEL[source],
    targetName: LABEL[target],
    serviceMappings: mappings,
    considerations: [
      'Data egress costs and transfer time for storage/databases.',
      'IAM/identity model differences require policy re-mapping.',
      'Managed-service feature gaps may need refactoring (e.g. DynamoDB ↔ Cosmos DB).',
      'Networking (VPC/VNet) and DNS cutover planning.'
    ]
  };
}

/** Create a migration plan and persist a MigrationReport. */
export async function plan({ sourceProvider, targetProvider, workloadName, user }) {
  const cmp = compare(sourceProvider, targetProvider);

  // Pull source cost + resources to estimate effort/risk/cost.
  const adapter = providerFactory.get(sourceProvider);
  const [cost, resources] = await Promise.all([adapter.getCostSummary(), adapter.getResources()]);
  const monthlyBefore = round(cost.monthlyCost || 0);
  const monthlyAfter = round(monthlyBefore * 0.95);
  const resourceCount = resources.total || 0;

  // Risk scales with resource count + managed-service lock-in.
  const managed = (resources.items || []).filter((r) => r.lockInRisk === 'high' || r.lockInRisk === 'medium').length;
  const riskLevel = managed > 3 || resourceCount > 20 ? SEVERITY.HIGH : managed > 0 ? SEVERITY.MEDIUM : SEVERITY.LOW;
  const downtimeEstimateMinutes = 15 + Math.min(resourceCount, 40) * 3;

  const planSteps = [
    { order: 1, title: 'Assess & inventory', description: 'Catalog source resources, dependencies, and data volumes.', estimatedHours: 8 },
    { order: 2, title: 'Provision target infrastructure (Terraform)', description: `Create ${cmp.targetName} equivalents for each mapped service.`, estimatedHours: 16 },
    { order: 3, title: 'Data migration', description: 'Replicate storage/databases with dual-write + backfill.', estimatedHours: 24 },
    { order: 4, title: 'Application cutover', description: 'Switch traffic, validate, and decommission source.', estimatedHours: 6 }
  ];

  const report = await MigrationReport.create({
    sourceProvider,
    targetProvider,
    workloadName: workloadName || 'workload',
    status: MIGRATION_STATUS.PLANNED,
    plan: planSteps,
    costEstimate: { currency: cost.currency || 'USD', oneTime: round(resourceCount * 50 + 500), monthlyBefore, monthlyAfter },
    riskLevel,
    riskAssessment: [
      `${managed} managed/lock-in service(s) require careful handling.`,
      'Validate IAM and networking parity before cutover.',
      'Plan a rollback path and a maintenance window.'
    ],
    downtimeEstimateMinutes,
    serviceMappings: cmp.serviceMappings.map((m) => ({ source: m.source, target: m.target })),
    user: user.id ?? user._id,
    createdBy: user.id ?? user._id,
    ownerRole: user.role
  });

  return {
    id: String(report.id),
    sourceProvider,
    targetProvider,
    workloadName: report.workloadName,
    status: report.status,
    riskLevel: report.riskLevel,
    downtimeEstimateMinutes: report.downtimeEstimateMinutes,
    costEstimate: report.costEstimate,
    plan: report.plan,
    serviceMappings: report.serviceMappings,
    riskAssessment: report.riskAssessment,
    createdAt: report.createdAt
  };
}

/** Paginated migration report history. */
export async function getReports({ page, limit, sourceProvider, targetProvider } = {}) {
  const filter = {};
  if (sourceProvider) filter.sourceProvider = sourceProvider;
  if (targetProvider) filter.targetProvider = targetProvider;
  const result = await MigrationReport.paginate(filter, { page, limit, sort: '-createdAt' });
  return {
    ...result,
    results: result.results.map((r) => ({
      id: String(r.id),
      sourceProvider: r.sourceProvider,
      targetProvider: r.targetProvider,
      workloadName: r.workloadName,
      status: r.status,
      riskLevel: r.riskLevel,
      downtimeEstimateMinutes: r.downtimeEstimateMinutes,
      createdAt: r.createdAt
    }))
  };
}

export default { compare, plan, getReports };
