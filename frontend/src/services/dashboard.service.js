/**
 * Dashboard service — now API-driven (Module 2 backend).
 * Each method maps to a real backend endpoint under /api/dashboard.
 */
import api from './api.js';

const dashboardService = {
  getOverview: () => api.get('/dashboard/overview').then((r) => r.data.data),
  getCharts: () => api.get('/dashboard/charts').then((r) => r.data.data),
  getHealthScore: () => api.get('/dashboard/health-score').then((r) => r.data.data),
  getDeploymentStats: () => api.get('/dashboard/deployments/stats').then((r) => r.data.data),
  getDeploymentTrends: (params) =>
    api.get('/dashboard/deployments/trends', { params }).then((r) => r.data.data),
  getResourceUtilization: () => api.get('/dashboard/resource-utilization').then((r) => r.data.data),
  getCostSummary: () => api.get('/dashboard/cost-summary').then((r) => r.data.data),
  getSecuritySummary: () => api.get('/dashboard/security-summary').then((r) => r.data.data),
  getComplianceSummary: () => api.get('/dashboard/compliance-summary').then((r) => r.data.data),
  listDeployments: (params) => api.get('/dashboard/deployments', { params }).then((r) => r.data.data)
};

export default dashboardService;
