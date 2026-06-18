/**
 * AI Cloud Advisor API client — maps to /api/ai.
 */
import api from './api.js';

const aiService = {
  generate: (payload) => api.post('/ai/advisor', payload).then((r) => r.data.data),
  recommendations: (params) => api.get('/ai/recommendations', { params }).then((r) => r.data.data)
};

export default aiService;
