# Phase 1 — Architecture Design

**Project:** AI-Powered Multi-Cloud Portability and Deployment Automation Platform
**Repository:** `Cloud-portaibility-app`
**Tagline:** Deploy, monitor, optimize, secure, migrate, and manage applications across AWS, Azure, and GCP from one unified, AI-assisted control plane.

---

## 1. Design Goals & Guiding Principles

| Goal | How we achieve it |
|------|-------------------|
| **Near-zero cost** | Everything runs locally via Docker Compose. Cloud SDK calls default to a **mock/demo adapter** unless real credentials are supplied. MongoDB Atlas free tier (M0). |
| **Runnable offline / Demo Mode** | A `DEMO_MODE=true` flag seeds realistic data so recruiters see a fully functional app with no cloud accounts. |
| **AWS-first** | Cloud abstraction layer ships with a complete AWS adapter; Azure & GCP adapters implement the same interface afterward. |
| **Modular & clean** | Layered backend (routes → controllers → services → cloud-adapters → models). Feature-isolated React modules. |
| **Production-grade** | Env-based config, centralized error handling, structured logging, request validation, security middleware, RBAC. |
| **Portfolio-ready** | PWA, responsive mobile-first UI, README, diagrams, screenshots, CI/CD, IaC, monitoring. |

**Architectural style:** Modular monolith with a **pluggable Cloud Provider Adapter pattern**.

---

## 2. High-Level System Architecture

```
                          ┌───────────────────────────────────────────────┐
                          │                  USERS / BROWSER               │
                          │   (Desktop · Tablet · Mobile · PWA install)    │
                          └───────────────────────┬───────────────────────┘
                                                  │ HTTPS / JSON
                                                  ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │                         FRONTEND (React + Tailwind)                    │
        │  React Router · Recharts · PWA (service worker, manifest) · Axios      │
        └───────────────────────────────┬──────────────────────────────────────┘
                                         │ REST API (Bearer JWT)
                                         ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │                    BACKEND API (Node.js + Express)                     │
        │  Middleware: Helmet · CORS · Rate-Limit · JWT Auth · RBAC ·            │
        │              Validation · Error Handler · Request Logger               │
        │  Controllers → Services → Cloud Adapter Interface                      │
        │                          (AWS · Azure · GCP · MOCK)                    │
        │  AI Service (Bedrock / Claude) with mock fallback                      │
        └───────┬─────────────────────────────┬──────────────────┬──────────────┘
                ▼                              ▼                  ▼
     ┌─────────────────────┐     ┌─────────────────────┐  ┌────────────────────┐
     │   MongoDB Atlas      │     │  Amazon Bedrock      │  │  Cloud Provider     │
     │   (M0 free tier)     │     │  (Claude) optional   │  │  SDKs optional + TF │
     └─────────────────────┘     └─────────────────────┘  └────────────────────┘

     ┌──────────────────── OBSERVABILITY (Docker network) ───────────────────────┐
     │  Backend /metrics  →  Prometheus  →  Grafana (CPU/Mem/Disk/Net/Uptime)     │
     └────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cloud Provider Adapter Pattern (key abstraction)

```
interface CloudProvider {
  getStatus()              listDeployments()       listContainers()
  scanSecurity()           getCostReport()         generateTerraform(spec)
  applyTerraform(plan)     destroyTerraform(plan)  listKubernetes()
  getMonitoringMetrics()   getCarbonEstimate()
}
```

- `AwsProvider` (implemented first), `AzureProvider`, `GcpProvider`, `MockProvider` (Demo Mode).
- A `ProviderFactory` returns the correct adapter based on the requested provider and whether credentials / `DEMO_MODE` are set.

---

## 4. RBAC Matrix

| Capability | Admin | Cloud Engineer | DevOps Engineer | Viewer |
|------------|:---:|:---:|:---:|:---:|
| View dashboards/reports | ✅ | ✅ | ✅ | ✅ |
| Run AI analysis | ✅ | ✅ | ✅ | ❌ |
| Generate/Deploy Terraform | ✅ | ✅ | ✅ | ❌ |
| Docker/K8s actions | ✅ | ✅ | ✅ | ❌ |
| Rollback / Destroy infra | ✅ | ✅ | ❌ | ❌ |
| Manage users & settings | ✅ | ❌ | ❌ | ❌ |

---

## 5. Runtime Topology (Docker Compose)

| Service | Image / Build | Port |
|---------|---------------|------|
| frontend | React build + Nginx | 3000 |
| backend | Node 20 Express | 5000 |
| mongo (optional local) | mongo:7 | 27017 |
| prometheus | prom/prometheus | 9090 |
| grafana | grafana/grafana | 3001 |

---

> Full module-to-layer mapping and data-flow examples are maintained in the project wiki / subsequent phase docs.
