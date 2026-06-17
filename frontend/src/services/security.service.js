/**
 * Security Center API client — maps to /api/security.
 * `overview` and `riskScore` are available to any authenticated role;
 * the detailed endpoints require Cloud Engineer or above.
 */
import api from './api.js';

const securityService = {
  overview: () => api.get('/security/overview').then((r) => r.data.data),
  riskScore: () => api.get('/security/risk-score').then((r) => r.data.data),
  failedLogins: (hours = 24) => api.get('/security/failed-logins', { params: { hours } }).then((r) => r.data.data),
  accessLogs: (params) => api.get('/security/access-logs', { params }).then((r) => r.data.data),
  events: (params) => api.get('/security/events', { params }).then((r) => r.data.data)
};

export default securityService;
