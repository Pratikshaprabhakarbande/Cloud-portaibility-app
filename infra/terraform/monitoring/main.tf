# Monitoring infrastructure intent (Prometheus/Grafana, alerting).
# The running stack is provided locally via docker-compose + infra/monitoring.
# This directory is for cloud-managed monitoring resources when needed.

variable "enable_managed_monitoring" {
  description = "Provision cloud-managed monitoring (e.g. AMP/Azure Monitor/Cloud Monitoring)"
  type        = bool
  default     = false
}
