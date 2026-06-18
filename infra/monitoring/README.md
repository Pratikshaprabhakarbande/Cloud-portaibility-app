# monitoring/

Prometheus + Grafana stack (provisioned via Docker Compose).

- `prometheus/prometheus.yml` — scrape config; targets backend `/metrics`.
- `grafana/provisioning/datasources/` — auto-adds Prometheus datasource.
- `grafana/provisioning/dashboards/` — registers the dashboards folder.
- `grafana/dashboards/` — JSON dashboards (CPU, memory, disk, network, uptime) added in Phase 11.
