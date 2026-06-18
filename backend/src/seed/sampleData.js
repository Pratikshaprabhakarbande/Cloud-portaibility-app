/**
 * Demo / sample dataset.
 *
 * Powers "Recruiter Demonstration Mode" — the platform looks fully functional
 * with no cloud accounts. All values are fictional and free-tier friendly.
 *
 * NOTE: User passwords here are plaintext; the User model's pre-save hook
 * hashes them with bcrypt during seeding.
 */
import {
  ROLES,
  PROVIDERS,
  DEPLOYMENT_TYPES,
  DEPLOYMENT_STATUS,
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  SEVERITY,
  COMPLIANCE_FRAMEWORKS,
  CHECK_STATUS,
  INCIDENT_STATUS,
  MIGRATION_STATUS,
  RECOMMENDATION_TYPES,
  AI_SOURCES,
  NOTIFICATION_TYPES
} from '../config/constants.js';

export const users = [
  { name: 'Ava Admin', email: 'admin@demo.io', password: 'Admin@12345', role: ROLES.ADMIN, organization: 'Acme Cloud' },
  { name: 'Carlos Cloud', email: 'cloud@demo.io', password: 'Cloud@12345', role: ROLES.CLOUD_ENGINEER, organization: 'Acme Cloud' },
  { name: 'Devi DevOps', email: 'devops@demo.io', password: 'Devops@12345', role: ROLES.DEVOPS_ENGINEER, organization: 'Acme Cloud' },
  { name: 'Vera Viewer', email: 'viewer@demo.io', password: 'Viewer@12345', role: ROLES.VIEWER, organization: 'Acme Cloud' }
];

// Builders receive the created user docs so we can attach ObjectId references.
export function buildDeployments(usersByRole) {
  const dev = usersByRole[ROLES.DEVOPS_ENGINEER];
  const cloud = usersByRole[ROLES.CLOUD_ENGINEER];
  return [
    {
      name: 'payments-api',
      provider: PROVIDERS.AWS,
      region: 'us-east-1',
      type: DEPLOYMENT_TYPES.TERRAFORM,
      status: DEPLOYMENT_STATUS.SUCCESS,
      version: 3,
      user: dev._id,
      durationMs: 142000,
      artifact: { image: 'acme/payments-api:1.4.2', repository: 'acme/payments-api', commitSha: 'a1b2c3d' },
      startedAt: new Date(Date.now() - 86400000),
      finishedAt: new Date(Date.now() - 86400000 + 142000)
    },
    {
      name: 'web-frontend',
      provider: PROVIDERS.AWS,
      region: 'us-east-1',
      type: DEPLOYMENT_TYPES.DOCKER,
      status: DEPLOYMENT_STATUS.SUCCESS,
      version: 7,
      user: dev._id,
      durationMs: 53000
    },
    {
      name: 'analytics-job',
      provider: PROVIDERS.GCP,
      region: 'us-central1',
      type: DEPLOYMENT_TYPES.KUBERNETES,
      status: DEPLOYMENT_STATUS.FAILED,
      version: 1,
      user: cloud._id,
      errorMessage: 'ImagePullBackOff: registry auth failed'
    },
    {
      name: 'notification-svc',
      provider: PROVIDERS.AZURE,
      region: 'eastus',
      type: DEPLOYMENT_TYPES.KUBERNETES,
      status: DEPLOYMENT_STATUS.IN_PROGRESS,
      version: 2,
      user: cloud._id
    }
  ];
}

export function buildCloudResources() {
  return [
    { resourceId: 'i-0a1b2c3d4e5f', name: 'payments-ec2', provider: PROVIDERS.AWS, region: 'us-east-1', type: RESOURCE_TYPES.COMPUTE, service: 'EC2', status: RESOURCE_STATUS.RUNNING, monthlyCost: 0, isManaged: false, lockInRisk: 'low' },
    { resourceId: 'acme-assets-bucket', name: 'acme-assets', provider: PROVIDERS.AWS, region: 'us-east-1', type: RESOURCE_TYPES.STORAGE, service: 'S3', status: RESOURCE_STATUS.RUNNING, monthlyCost: 1.2, isManaged: true, lockInRisk: 'medium' },
    { resourceId: 'payments-dynamodb', name: 'payments-table', provider: PROVIDERS.AWS, region: 'us-east-1', type: RESOURCE_TYPES.DATABASE, service: 'DynamoDB', status: RESOURCE_STATUS.RUNNING, monthlyCost: 0, isManaged: true, lockInRisk: 'high' },
    { resourceId: 'aks-cluster-1', name: 'prod-aks', provider: PROVIDERS.AZURE, region: 'eastus', type: RESOURCE_TYPES.KUBERNETES, service: 'AKS', status: RESOURCE_STATUS.RUNNING, monthlyCost: 0, isManaged: true, lockInRisk: 'medium' },
    { resourceId: 'gke-cluster-1', name: 'analytics-gke', provider: PROVIDERS.GCP, region: 'us-central1', type: RESOURCE_TYPES.KUBERNETES, service: 'GKE', status: RESOURCE_STATUS.RUNNING, monthlyCost: 0, isManaged: true, lockInRisk: 'medium' }
  ];
}

export function buildSecurityReports(user) {
  return [
    {
      provider: PROVIDERS.AWS,
      region: 'us-east-1',
      scanType: 'scan',
      securityScore: 78,
      riskScore: 34,
      user: user._id,
      recommendations: ['Restrict SSH (22) to known CIDRs', 'Enable S3 Block Public Access account-wide'],
      findings: [
        { title: 'Security group allows 0.0.0.0/0 on port 22', category: 'security_group', severity: SEVERITY.HIGH, resourceId: 'sg-001', recommendation: 'Limit inbound SSH to corporate IPs.' },
        { title: 'S3 bucket is publicly readable', category: 'public_bucket', severity: SEVERITY.CRITICAL, resourceId: 'acme-assets-bucket', recommendation: 'Enable Block Public Access.' },
        { title: 'IAM user with AdministratorAccess', category: 'weak_iam', severity: SEVERITY.MEDIUM, resourceId: 'iam/ci-bot', recommendation: 'Apply least-privilege policy.' }
      ]
    }
  ];
}

export function buildComplianceReports(user) {
  return [
    {
      provider: PROVIDERS.AWS,
      framework: COMPLIANCE_FRAMEWORKS.CIS,
      user: user._id,
      controls: [
        { controlId: 'CIS 1.4', title: 'Ensure no root account access key exists', status: CHECK_STATUS.PASS, severity: SEVERITY.HIGH, remediation: 'Delete root access keys.' },
        { controlId: 'CIS 2.1.1', title: 'Ensure S3 bucket encryption is enabled', status: CHECK_STATUS.FAIL, severity: SEVERITY.HIGH, remediation: 'Enable default SSE on buckets.' },
        { controlId: 'CIS 3.1', title: 'Ensure CloudTrail is enabled in all regions', status: CHECK_STATUS.WARN, severity: SEVERITY.MEDIUM, remediation: 'Enable multi-region trail.' }
      ]
    }
  ];
}

export function buildPortabilityReports(user) {
  return [
    {
      provider: PROVIDERS.AWS,
      workloadName: 'payments-api',
      user: user._id,
      portabilityScore: 62,
      lockInRisks: ['DynamoDB has no direct cross-cloud equivalent', 'Heavy use of AWS Lambda triggers'],
      migrationRecommendations: ['Abstract data layer behind a repository', 'Containerize Lambda functions'],
      summary: 'Moderately portable; data services are the main lock-in.',
      dependencies: [
        { service: 'DynamoDB', category: 'database', lockInRisk: 'high', portableAlternative: 'MongoDB / Cosmos DB', notes: 'Proprietary API.' },
        { service: 'S3', category: 'storage', lockInRisk: 'medium', portableAlternative: 'GCS / Azure Blob', notes: 'S3-compatible APIs exist.' }
      ]
    }
  ];
}

export function buildMigrationReports(user) {
  return [
    {
      sourceProvider: PROVIDERS.AWS,
      targetProvider: PROVIDERS.AZURE,
      workloadName: 'payments-api',
      status: MIGRATION_STATUS.PLANNED,
      user: user._id,
      riskLevel: SEVERITY.MEDIUM,
      downtimeEstimateMinutes: 30,
      riskAssessment: ['Data migration requires dual-write window', 'IAM model differences'],
      costEstimate: { currency: 'USD', oneTime: 1200, monthlyBefore: 340, monthlyAfter: 310 },
      serviceMappings: [
        { source: 'EC2', target: 'Azure VM' },
        { source: 'DynamoDB', target: 'Cosmos DB' },
        { source: 'S3', target: 'Blob Storage' }
      ],
      plan: [
        { order: 1, title: 'Assess & inventory', description: 'Catalog resources and dependencies', estimatedHours: 8 },
        { order: 2, title: 'Provision target infra (Terraform)', description: 'Create Azure equivalents', estimatedHours: 16 },
        { order: 3, title: 'Data migration', description: 'Dual-write + backfill', estimatedHours: 24 },
        { order: 4, title: 'Cutover & validate', description: 'Switch traffic, verify', estimatedHours: 6 }
      ]
    }
  ];
}

export function buildIncidentReports(user) {
  return [
    {
      title: 'Payments API 5xx spike',
      provider: PROVIDERS.AWS,
      severity: SEVERITY.HIGH,
      status: INCIDENT_STATUS.RESOLVED,
      user: user._id,
      aiSource: AI_SOURCES.MOCK,
      inputs: { logs: 'ECONNREFUSED mongodb:27017', errors: '500 Internal Server Error x142', alerts: 'CPU > 90%' },
      rootCause: 'Database connection pool exhausted during a traffic burst.',
      suggestedFix: 'Increase maxPoolSize and add a circuit breaker with retry/backoff.',
      report: 'Incident triggered by a 3x traffic spike; mitigated by scaling and pool tuning.',
      resolvedAt: new Date()
    }
  ];
}

export function buildCostReports(user) {
  const month = new Date().toISOString().slice(0, 7);
  return [
    {
      provider: PROVIDERS.AWS,
      currency: 'USD',
      period: { date: new Date(), month },
      dailyCost: 4.2,
      monthlyCost: 126,
      projectedCost: 132,
      user: user._id,
      breakdown: [
        { service: 'EC2', cost: 60, percentage: 48 },
        { service: 'S3', cost: 12, percentage: 10 },
        { service: 'DynamoDB', cost: 30, percentage: 24 },
        { service: 'Data Transfer', cost: 24, percentage: 18 }
      ],
      recommendations: [
        { title: 'Right-size EC2', description: 'Move t3.large → t3.medium', estimatedMonthlySavings: 22 },
        { title: 'S3 lifecycle to IA', description: 'Archive cold objects', estimatedMonthlySavings: 6 }
      ]
    }
  ];
}

export function buildAIRecommendations(user) {
  return [
    {
      type: RECOMMENDATION_TYPES.ARCHITECTURE,
      title: 'Architecture for a 10k-user SaaS on a $200/mo budget',
      user: user._id,
      aiSource: AI_SOURCES.MOCK,
      model: 'mock-generator',
      inputs: { budget: 200, region: 'us-east-1', expectedUsers: 10000, appType: 'web', scalability: 'high' },
      architectures: {
        aws: { compute: 'ECS Fargate', db: 'DynamoDB', cdn: 'CloudFront', notes: 'Serverless-leaning for cost control' },
        azure: { compute: 'Container Apps', db: 'Cosmos DB', cdn: 'Azure CDN' },
        gcp: { compute: 'Cloud Run', db: 'Firestore', cdn: 'Cloud CDN' }
      },
      costEstimate: { currency: 'USD', monthly: 180 },
      securityRecommendations: ['Enable WAF', 'Use least-privilege IAM roles'],
      scalabilityRecommendations: ['Autoscale on CPU + RPS', 'Use managed caching']
    }
  ];
}

export function buildNotifications(user) {
  return [
    { user: user._id, type: NOTIFICATION_TYPES.SUCCESS, title: 'Deployment succeeded', message: 'payments-api v3 deployed to AWS us-east-1.' },
    { user: user._id, type: NOTIFICATION_TYPES.WARNING, title: 'Cost alert', message: 'AWS projected monthly cost is up 5%.' }
  ];
}
