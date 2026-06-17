/**
 * Terraform API client — maps to /api/terraform.
 */
import api from './api.js';

const terraformService = {
  run: (action, provider) => api.post(`/terraform/${action}`, { provider }).then((r) => r.data.data),
  history: (params) => api.get('/terraform/history', { params }).then((r) => r.data.data)
};

export default terraformService;
