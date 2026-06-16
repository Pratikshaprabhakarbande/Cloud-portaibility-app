/**
 * Dashboard service.
 *
 * Returns demo data today (backend dashboard endpoints arrive in a later phase).
 * The shape matches the planned API responses, so switching to live data only
 * requires replacing each method body with an `api.get(...)` call.
 */
// import api from './api.js';
import * as demo from '../data/demoData.js';

const delay = (ms = 350) => new Promise((res) => setTimeout(res, ms));

const dashboardService = {
  async getOverview() {
    // return api.get('/dashboard/overview').then((r) => r.data.data);
    await delay();
    return {
      providers: demo.cloudProviders,
      summary: demo.summary,
      recentDeployments: demo.recentDeployments
    };
  },

  async getCharts() {
    // return api.get('/dashboard/charts').then((r) => r.data.data);
    await delay();
    return {
      deploymentTrends: demo.deploymentTrends,
      cloudUsage: demo.cloudUsage,
      resourceUtilization: demo.resourceUtilization,
      costTrends: demo.costTrends
    };
  }
};

export default dashboardService;
