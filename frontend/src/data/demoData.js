/**
 * Demo dataset for the dashboard (Recruiter Demonstration Mode).
 * Mirrors the shape the backend dashboard endpoints will return in later
 * phases, so swapping to live data is a one-line change in dashboard.service.
 */

export const cloudProviders = [
  { key: 'aws', name: 'AWS', status: 'operational', region: 'us-east-1', healthScore: 96, activeDeployments: 8, runningContainers: 14 },
  { key: 'azure', name: 'Azure', status: 'operational', region: 'eastus', healthScore: 91, activeDeployments: 5, runningContainers: 9 },
  { key: 'gcp', name: 'GCP', status: 'degraded', region: 'us-central1', healthScore: 78, activeDeployments: 3, runningContainers: 6 }
];

export const summary = {
  activeDeployments: 16,
  runningContainers: 29,
  cloudHealthScore: 88,
  monthlyCost: 312.45,
  costChangePct: -4.2,
  openIncidents: 1,
  securityScore: 82
};

export const deploymentTrends = [
  { date: 'Mon', success: 4, failed: 1 },
  { date: 'Tue', success: 6, failed: 0 },
  { date: 'Wed', success: 5, failed: 2 },
  { date: 'Thu', success: 8, failed: 1 },
  { date: 'Fri', success: 7, failed: 0 },
  { date: 'Sat', success: 3, failed: 1 },
  { date: 'Sun', success: 5, failed: 0 }
];

export const cloudUsage = [
  { name: 'AWS', value: 52 },
  { name: 'Azure', value: 31 },
  { name: 'GCP', value: 17 }
];

export const resourceUtilization = [
  { time: '00:00', cpu: 32, memory: 48, network: 20 },
  { time: '04:00', cpu: 28, memory: 45, network: 18 },
  { time: '08:00', cpu: 64, memory: 60, network: 42 },
  { time: '12:00', cpu: 78, memory: 72, network: 55 },
  { time: '16:00', cpu: 71, memory: 69, network: 48 },
  { time: '20:00', cpu: 55, memory: 58, network: 35 }
];

export const costTrends = [
  { month: 'Jan', aws: 120, azure: 80, gcp: 40 },
  { month: 'Feb', aws: 132, azure: 78, gcp: 44 },
  { month: 'Mar', aws: 128, azure: 85, gcp: 39 },
  { month: 'Apr', aws: 140, azure: 90, gcp: 48 },
  { month: 'May', aws: 135, azure: 88, gcp: 45 },
  { month: 'Jun', aws: 150, azure: 92, gcp: 50 }
];

export const recentDeployments = [
  { id: 'd1', name: 'payments-api', provider: 'aws', type: 'terraform', status: 'success', version: 3, user: 'Devi DevOps', createdAt: '2026-06-15T10:24:00Z' },
  { id: 'd2', name: 'web-frontend', provider: 'aws', type: 'docker', status: 'success', version: 7, user: 'Devi DevOps', createdAt: '2026-06-15T09:02:00Z' },
  { id: 'd3', name: 'notification-svc', provider: 'azure', type: 'kubernetes', status: 'in_progress', version: 2, user: 'Carlos Cloud', createdAt: '2026-06-15T08:40:00Z' },
  { id: 'd4', name: 'analytics-job', provider: 'gcp', type: 'kubernetes', status: 'failed', version: 1, user: 'Carlos Cloud', createdAt: '2026-06-14T22:15:00Z' },
  { id: 'd5', name: 'auth-service', provider: 'aws', type: 'docker', status: 'success', version: 5, user: 'Ava Admin', createdAt: '2026-06-14T18:30:00Z' },
  { id: 'd6', name: 'billing-worker', provider: 'azure', type: 'kubernetes', status: 'rolled_back', version: 4, user: 'Devi DevOps', createdAt: '2026-06-14T14:05:00Z' }
];
