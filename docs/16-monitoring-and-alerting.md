# Monitoring & Alerting (Production)

Builds on `docs/08-monitoring-guide.md` with alert rules and a log-aggregation
architecture.

## Alert rules (Prometheus)

`infra/monitoring/prometheus/alerts.yml` is loaded via `rule_files` in
`prometheus.yml` and evaluated continuously (visible at
http://localhost:9090/alerts):

| Alert | Condition | Severity |
|-------|-----------|----------|
| `BackendDown` | `up{job="backend"} == 0` for 1m | critical |
| `HighErrorRate` | `rate(http_request_errors_total[5m]) > 1` for 5m | warning |
| `HighRequestLatencyP95` | p95 `http_request_duration_seconds` > 1s for 10m | warning |
| `LowSecurityScore` | `cloud_security_score{provider="overall"} < 60` for 10m | warning |
| `OpenIncidents` | `cloud_open_incidents > 0` for 15m | info |

### Routing notifications (Alertmanager — optional)
Uncomment the `alerting:` block in `prometheus.yml` and add an Alertmanager
service to route to Slack/email/PagerDuty:

```yaml
  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./infra/monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
    ports: ["9093:9093"]
    networks: [cloudnet]
```

### Grafana alerting (UI or provisioning)
Grafana can alert on the same Prometheus datasource. Create alerts under
**Alerting → Alert rules** using the queries above, or provision them via
`grafana/provisioning/alerting/*.yaml`. The provisioned **dashboards** already
visualize these metrics (`infra/monitoring/grafana/dashboards/`).

## Log aggregation architecture

Application logs are structured JSON (Winston) on stdout — container-native and
ready for shipping. Recommended production pipeline (Grafana Loki):

```
backend (Winston JSON → stdout)
        │
   Promtail / Grafana Alloy (Docker log driver / file scrape)
        │
      Loki (log store, label-indexed)
        │
     Grafana (Explore + dashboards + log-based alerts)
```

Reference services (add to a `docker-compose.logging.yml` overlay):

```yaml
services:
  loki:
    image: grafana/loki:latest
    command: -config.file=/etc/loki/local-config.yaml
    ports: ["3100:3100"]
    networks: [cloudnet]
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
    command: -config.file=/etc/promtail/config.yml
    networks: [cloudnet]
```

Add Loki as a Grafana datasource (provisioning) and use **Explore** to query by
container label. Alternative stacks: ELK (Elasticsearch + Logstash + Kibana) or a
managed service (CloudWatch Logs / Azure Monitor Logs / Cloud Logging).

## Production readiness checklist (monitoring)
- [x] `/metrics` endpoint (HTTP + runtime + business gauges)
- [x] Prometheus scrape + alert rules
- [x] Grafana datasource + 6 provisioned dashboards
- [ ] Alertmanager routing to a real channel (env-specific)
- [ ] Loki/Promtail (or ELK) deployed for centralized logs
- [ ] Retention/Storage sizing for Prometheus + Loki
