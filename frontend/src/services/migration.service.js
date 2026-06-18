import api from './api.js';

const migrationService = {
  compare: (source, target) => api.get('/migration/compare', { params: { source, target } }).then((r) => r.data.data),
  plan: (payload) => api.post('/migration/plan', payload).then((r) => r.data.data),
  reports: (params) => api.get('/migration/reports', { params }).then((r) => r.data.data)
};
export default migrationService;
