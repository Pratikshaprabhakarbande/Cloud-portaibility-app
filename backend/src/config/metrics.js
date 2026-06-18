/**
 * Prometheus metrics (prom-client).
 *
 * Exposes a dedicated registry with Node/process default metrics plus custom
 * HTTP request metrics:
 *   - http_requests_total          (counter)  — request count
 *   - http_request_duration_seconds(histogram)— response duration
 *   - http_request_errors_total    (counter)  — error count (status >= 500)
 *
 * Scraped by Prometheus at GET /metrics (see infra/monitoring/prometheus).
 */
import client from 'prom-client';
import logger from '../utils/logger.js';

export const register = new client.Registry();
register.setDefaultLabels({ app: 'cloud-portability-backend' });

// Node process / GC / event-loop metrics.
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

const httpRequestErrorsTotal = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP responses with a 5xx status',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

/* ----------------------- Business / platform gauges ------------------------ */
/* Populated periodically from the dashboard service (see collector below), so
 * the Grafana dashboards reflect real data rather than placeholders. */

const cloudHealthScore = new client.Gauge({
  name: 'cloud_health_score',
  help: 'Cloud health score 0-100 (label provider=overall|aws|azure|gcp)',
  labelNames: ['provider'],
  registers: [register]
});
const cloudActiveDeployments = new client.Gauge({
  name: 'cloud_active_deployments',
  help: 'Active deployments across the selected scope',
  registers: [register]
});
const cloudRunningContainers = new client.Gauge({
  name: 'cloud_running_containers',
  help: 'Running containers across the selected scope',
  registers: [register]
});
const cloudOpenIncidents = new client.Gauge({
  name: 'cloud_open_incidents',
  help: 'Open/investigating incidents',
  registers: [register]
});
const cloudMonthlyCostUsd = new client.Gauge({
  name: 'cloud_monthly_cost_usd',
  help: 'Estimated monthly cost in USD (label provider=total|aws|azure|gcp)',
  labelNames: ['provider'],
  registers: [register]
});
const cloudSecurityScore = new client.Gauge({
  name: 'cloud_security_score',
  help: 'Security score 0-100 (label provider=overall|aws|azure|gcp)',
  labelNames: ['provider'],
  registers: [register]
});

/**
 * Refresh business gauges from the dashboard service (multi-cloud scope).
 * Lazy-imports the service to avoid any import cycle. Safe to call repeatedly;
 * errors (e.g. DB unavailable) are swallowed so /metrics never breaks.
 */
export async function updateBusinessMetrics() {
  const dash = await import('../services/dashboard.service.js');
  const overview = await dash.getOverview();
  cloudHealthScore.set({ provider: 'overall' }, overview.summary.cloudHealthScore);
  overview.providers.forEach((p) => cloudHealthScore.set({ provider: p.key }, p.healthScore));
  cloudActiveDeployments.set(overview.summary.activeDeployments);
  cloudRunningContainers.set(overview.summary.runningContainers);
  cloudOpenIncidents.set(overview.summary.openIncidents);

  const cost = await dash.getCostSummary();
  cloudMonthlyCostUsd.set({ provider: 'total' }, cost.totals.monthlyCost);
  cost.breakdown.forEach((b) => cloudMonthlyCostUsd.set({ provider: b.provider }, b.monthlyCost));

  const sec = await dash.getSecuritySummary();
  if (typeof sec.overallSecurity === 'number') cloudSecurityScore.set({ provider: 'overall' }, sec.overallSecurity);
  sec.providers.forEach((p) => {
    if (typeof p.securityScore === 'number') cloudSecurityScore.set({ provider: p.provider }, p.securityScore);
  });
}

let collectorTimer = null;

/** Start the periodic business-metrics collector (no-op if already running). */
export function startBusinessMetricsCollector(intervalMs = 30000) {
  if (collectorTimer) return;
  const tick = () =>
    updateBusinessMetrics().catch((err) =>
      logger.warn(`[metrics] business metrics update skipped: ${err.message}`)
    );
  tick();
  collectorTimer = setInterval(tick, intervalMs);
  if (collectorTimer.unref) collectorTimer.unref(); // don't keep the process alive
}

export function stopBusinessMetricsCollector() {
  if (collectorTimer) clearInterval(collectorTimer);
  collectorTimer = null;
}

/**
 * Normalize the route label to the matched route pattern (not the raw URL),
 * keeping label cardinality bounded. Falls back to 'unknown' for unmatched.
 */
function routeLabel(req) {
  const base = req.baseUrl || '';
  const path = req.route?.path || '';
  const combined = `${base}${path}`;
  return combined || req.path || 'unknown';
}

/** Express middleware that records request count, duration, and errors. */
export function metricsMiddleware(req, res, next) {
  const endTimer = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: routeLabel(req), status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
    if (res.statusCode >= 500) httpRequestErrorsTotal.inc(labels);
  });
  next();
}

/** GET /metrics handler — returns the Prometheus exposition format. */
export async function metricsHandler(_req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

export default {
  register,
  metricsMiddleware,
  metricsHandler,
  updateBusinessMetrics,
  startBusinessMetricsCollector,
  stopBusinessMetricsCollector
};
