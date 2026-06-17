/**
 * k6 load-test smoke script.
 *
 * Targets: auth (login), dashboard (overview), compliance (scan),
 * finops (recommendations), migration (compare).
 *
 * Run: k6 run loadtest/smoke.js
 * Prerequisites: backend running (seeded), k6 CLI installed.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:5000/api';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05']
  }
};

export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify({
    email: 'admin@demo.io',
    password: 'Admin@12345'
  }), { headers: { 'Content-Type': 'application/json' } });
  const token = res.json('data.tokens.accessToken');
  return { token };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' };

  // Dashboard overview
  const dash = http.get(`${BASE}/dashboard/overview`, { headers });
  check(dash, { 'dashboard 200': (r) => r.status === 200 });

  // Compliance scan
  const comp = http.post(`${BASE}/compliance/scan`, JSON.stringify({ provider: 'aws', framework: 'CIS' }), { headers });
  check(comp, { 'compliance 201': (r) => r.status === 201 });

  // FinOps recommendations
  const fin = http.get(`${BASE}/finops/recommendations?provider=aws`, { headers });
  check(fin, { 'finops 200': (r) => r.status === 200 });

  // Migration compare
  const mig = http.get(`${BASE}/migration/compare?source=aws&target=azure`, { headers });
  check(mig, { 'migration 200': (r) => r.status === 200 });

  sleep(1);
}
