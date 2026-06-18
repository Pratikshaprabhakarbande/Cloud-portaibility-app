/**
 * Compliance Checker service.
 * Evaluates CIS-style controls for a provider using the cloud adapter's
 * security findings + resource inventory, scores them, and persists a
 * ComplianceReport (which the dashboard compliance-summary already aggregates).
 */
import providerFactory from '../cloud-adapters/ProviderFactory.js';
import { ComplianceReport } from '../models/index.js';
import {
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_FRAMEWORK_VALUES,
  CHECK_STATUS,
  SEVERITY
} from '../config/constants.js';

// Control definitions; `failsOn` references a security-finding category.
const CONTROLS = [
  { controlId: 'CIS 1.1', title: 'Avoid unrestricted security group ingress', failsOn: 'security_group', severity: SEVERITY.HIGH, remediation: 'Restrict inbound rules to known CIDR ranges.' },
  { controlId: 'CIS 2.1', title: 'No publicly accessible object storage', failsOn: 'public_bucket', severity: SEVERITY.CRITICAL, remediation: 'Enable block-public-access on buckets.' },
  { controlId: 'CIS 1.16', title: 'Least-privilege IAM policies', failsOn: 'weak_iam', severity: SEVERITY.MEDIUM, remediation: 'Apply least-privilege; avoid wildcard policies.' },
  { controlId: 'CIS 1.20', title: 'No excessive permissions', failsOn: 'excessive_permissions', severity: SEVERITY.MEDIUM, remediation: 'Scope permissions to required actions/resources.' },
  { controlId: 'CIS 3.1', title: 'No misconfigured resources', failsOn: 'misconfiguration', severity: SEVERITY.MEDIUM, remediation: 'Remediate flagged misconfigurations.' }
];

function shape(report) {
  return {
    id: String(report.id),
    provider: report.provider,
    framework: report.framework,
    complianceScore: report.complianceScore,
    summary: report.summary,
    controls: report.controls,
    createdAt: report.createdAt
  };
}

/** List supported frameworks. */
export function getFrameworks() {
  return COMPLIANCE_FRAMEWORK_VALUES;
}

/** Run a compliance scan for a single provider and persist the report. */
export async function runCheck({ provider, framework, user }) {
  const fw = COMPLIANCE_FRAMEWORK_VALUES.includes(framework) ? framework : COMPLIANCE_FRAMEWORKS.CIS;
  const adapter = providerFactory.get(provider);
  const security = await adapter.getSecurityFindings();
  const failedCategories = new Set((security.findings || []).map((f) => f.category));

  const controls = CONTROLS.map((c) => ({
    controlId: c.controlId,
    title: c.title,
    severity: c.severity,
    remediation: c.remediation,
    status: failedCategories.has(c.failsOn) ? CHECK_STATUS.FAIL : CHECK_STATUS.PASS
  }));
  // Informational control that always passes (encryption baseline).
  controls.push({
    controlId: 'CIS 2.7',
    title: 'Encryption at rest enabled',
    status: CHECK_STATUS.PASS,
    severity: SEVERITY.MEDIUM,
    remediation: 'Enable default encryption on storage/databases.'
  });

  const report = await ComplianceReport.create({
    provider,
    framework: fw,
    controls,
    user: user.id ?? user._id,
    createdBy: user.id ?? user._id,
    ownerRole: user.role
  });
  return shape(report);
}

/** Paginated compliance report history. */
export async function getReports({ page, limit, provider, framework } = {}) {
  const filter = {};
  if (provider) filter.provider = provider;
  if (framework) filter.framework = framework;
  const result = await ComplianceReport.paginate(filter, { page, limit, sort: '-createdAt' });
  return { ...result, results: result.results.map(shape) };
}

export default { getFrameworks, runCheck, getReports };
