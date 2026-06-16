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

export default { register, metricsMiddleware, metricsHandler };
