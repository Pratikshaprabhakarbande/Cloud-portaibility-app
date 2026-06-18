# Monitoring Guide — Prometheus & Grafana

The platform ships a working observability stack via Docker Compose. This guide
explains what is exported, how Prometheus scrapes it, and the provisioned Grafana
dashboards.

---

## Stack

| Service | Port | Role |
|---------|------|------|
| backend `/metrics` | 5000 | Prometheus exposition endpoint (prom-client) |
| Prometheus | 9090 | Scrapes the backend and itself |
| Grafana | 3001 | Visualizes Prometheus data (auto-provisioned) |

Start everything: `docker compose up --build` (see the Deployment Guide).

---

## Prometheus

Scrape config: `infra/monitoring/prometheus/prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'prometheus'
    static_configs: [{ targets: ['localhost:9090'] }]
  - job_name: 'backend'
    metrics_path: /metrics
    static_configs: [{ targets: ['backend:5000'] }]
```

Verify the target is UP at http://localhost:9090/targets.

### Metrics exported by the backend

**HTTP (per request, via middleware):**
- `http_requests_total{method,route,status}` — request count
- `http_request_duration_seconds{...}` — latency histogram (use `histogram_quantile`)
- `http_request_errors_total{...}` — 5xx count

**Runtime (prom-client default metrics):**
- `process_cpu_seconds_total`, `process_resident_memory_bytes`
- `nodejs_heap_size_used_bytes`, `nodejs_eventloop_lag_seconds`, `nodejs_active_handles_total`, …

**Platform/business (refreshed every ~30s from the dashboard service):**
- `cloud_health_score{provider}` (overall|aws|azure|gcp)
- `cloud_active_deployments`, `cloud_running_containers`, `cloud_open_incidents`
- `cloud_monthly_cost_usd{provider}` (total|aws|azure|gcp)
- `cloud_security_score{provider}`

> The business gauges are populated by a periodic collector (`startBusinessMetricsCollector`)
> that reads the same cached data the dashboard API uses — so Grafana reflects real values.

### Example PromQL

```promql
sum(rate(http_requests_total[5m])) by (route)
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
sum(increase(http_request_errors_total[5m]))
cloud_health_score{provider="overall"}
cloud_monthly_cost_usd{provider!="total"}
```

---

## Grafana

- URL: http://localhost:3001 · default login `admin` / `admin` (override via `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD`).
- **Datasource** auto-provisioned: `infra/monitoring/grafana/provisioning/datasources/datasource.yml` (Prometheus, uid `prometheus`).
- **Dashboards** auto-provisioned from `infra/monitoring/grafana/dashboards/` (drop a new JSON in and it appears):

| Dashboard | File | Focus |
|-----------|------|-------|
| Backend Overview (Service Health) | `backend-overview.json` | req rate, p95 latency, 5xx, by status |
| Infrastructure (Runtime) | `infrastructure.json` | CPU, memory, event-loop lag, handles |
| Deployments | `deployment.json` | active deployments, containers, terraform API |
| Security | `security.json` | security score, open incidents, auth failures |
| Cost (FinOps) | `cost.json` | total + per-provider monthly cost |
| Multi-Cloud Overview | `multi-cloud.json` | per-provider health + cost |

### Add a new dashboard
Export its JSON from Grafana, save it into `infra/monitoring/grafana/dashboards/`,
and restart Grafana (`docker compose restart grafana`). No manual import needed.

---

## Troubleshooting

- **Backend target DOWN:** ensure the backend container is healthy and `/metrics`
  responds: `curl http://localhost:5000/metrics`.
- **Business gauges empty:** they populate after the DB is connected and seeded
  (`docker compose exec backend npm run seed`); the collector runs every ~30s.
- **Grafana shows "No data":** confirm the Prometheus datasource is green under
  Connections → Data sources, and that the time range covers recent activity.
