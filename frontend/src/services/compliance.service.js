import api from './api.js';

const complianceService = {
  frameworks: () => api.get('/compliance/frameworks').then((r) => r.data.data),
  scan: (payload) => api.post('/compliance/scan', payload).then((r) => r.data.data),
  reports: (params) => api.get('/compliance/reports', { params }).then((r) => r.data.data)
};
export default complianceService;
