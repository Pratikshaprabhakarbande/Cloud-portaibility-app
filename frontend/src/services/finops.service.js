import api from './api.js';

const finopsService = {
  summary: (provider) => api.get('/finops/summary', { params: { provider } }).then((r) => r.data.data),
  recommendations: (provider) => api.get('/finops/recommendations', { params: { provider } }).then((r) => r.data.data),
  analyze: (provider) => api.post('/finops/analyze', { provider }).then((r) => r.data.data),
  reports: (params) => api.get('/finops/reports', { params }).then((r) => r.data.data)
};
export default finopsService;
