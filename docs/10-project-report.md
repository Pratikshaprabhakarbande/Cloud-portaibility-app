# Project Report — AI-Powered Multi-Cloud Portability & Deployment Automation Platform

## Abstract

The platform is a unified, free-tier-friendly control plane for managing
applications across **AWS, Azure, and GCP**. It provides a single dashboard for
deployment visibility, cloud health scoring, cost (FinOps) insight, security
posture, and Infrastructure-as-Code automation. A pluggable **Cloud Provider
Adapter** layer keeps every feature cloud-agnostic, and a built-in **Demo Mode**
makes the entire system fully functional with **zero cloud accounts and near-zero
cost** — ideal for learning, demos, and evaluation. The stack is fully
containerized with first-class observability (Prometheus + Grafana) and CI/CD.

## Objectives

1. Provide a single pane of glass across multiple clouds (status, deployments, cost, security).
2. Demonstrate enterprise engineering practices: layered architecture, RBAC, validation, audit logging, centralized error handling.
3. Automate infrastructure with Terraform behind safe, role-gated APIs.
4. Deliver production-grade observability (metrics + provisioned dashboards).
5. Keep cost ≈ $0 via Demo Mode and free-tier services.
6. Be reproducible and portable (Docker Compose, CI/CD, IaC).

## Key Features

- **Authentication & RBAC** — JWT (short access + rotating, revocable refresh), bcrypt, 4 roles (Admin, Cloud Engineer, DevOps Engineer, Viewer), password reset, audit trail.
- **Multi-Cloud Dashboard** — provider status cards, health score, KPIs, charts (deployment trends, cloud usage, resource utilization, cost trends), deployment history with search/filter/pagination, and provider switching (aws/azure/gcp/multi-cloud).
- **Cloud Adapter Layer** — AWS/Azure/GCP/Mock/Multi-Cloud adapters, factory + registry, TTL caching.
- **Terraform Automation** — init/validate/plan/apply/destroy APIs, safe simulation by default, deployment-history tracking.
- **Observability** — `/metrics` (HTTP + runtime + business gauges), Prometheus scrape, six provisioned Grafana dashboards.
- **CI/CD** — lint, tests + coverage gate, Docker build, CodeQL, security scan, GHCR deploy.
- **PWA frontend** — React + Tailwind, dark mode, responsive, installable.

## Technology Stack

React 18 · Vite · Tailwind · Recharts · Node.js 20 · Express · MongoDB/Mongoose ·
JWT/bcrypt · Docker/Compose · Terraform · Prometheus · Grafana · GitHub Actions ·
Jest/supertest/mongodb-memory-server · Vitest/Testing Library.

## Architecture (summary)

Browser/PWA → Express API (Helmet, CORS, rate-limit, JWT, RBAC, validation,
error handler) → Controllers → Services → **Cloud Adapter Layer** + Repositories
→ MongoDB. Observability via backend `/metrics` → Prometheus → Grafana. See
[`01-architecture-design.md`](01-architecture-design.md), the module docs (02–08),
and [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md).

---

## Resume Description (ready to paste)

> **AI-Powered Multi-Cloud Portability & Deployment Automation Platform** — Built a
> full-stack, containerized platform (React, Node/Express, MongoDB) to manage
> deployments, cost, security, and IaC across AWS/Azure/GCP from one dashboard.
> Implemented a pluggable cloud-provider adapter layer, JWT auth with RBAC and
> audit logging, a safe-by-default Terraform automation engine, and full
> observability (Prometheus + 6 Grafana dashboards). Established CI/CD with
> GitHub Actions (lint, tests + coverage gate, CodeQL, Trivy, GHCR image
> publishing) and Docker Compose for one-command local deployment.

**Resume bullet points**
- Designed a provider-agnostic adapter layer (AWS/Azure/GCP/Mock/Multi-Cloud) with a factory/registry and TTL caching.
- Implemented JWT auth (rotating refresh tokens), RBAC, rate limiting, validation, and immutable audit logging.
- Built 10+ dashboard APIs with aggregation, pagination, filtering, and provider switching.
- Added Prometheus metrics + six provisioned Grafana dashboards; wired CI/CD with security scanning and GHCR deploys.
- Authored a safe-by-default Terraform automation engine with deployment-history tracking.

---

## Future Scope

- Live cloud SDK integrations (replace DB-backed demo data with real AWS/Azure/GCP APIs).
- AI Cloud Advisor with LLM (Amazon Bedrock/Claude) for cost/security/architecture recommendations.
- Remaining modules: Docker/Kubernetes engines, Security Center, Compliance, Migration Advisor, FinOps optimization, Green Cloud Score, ChatOps.
- HttpOnly-cookie refresh tokens + CSRF; secrets manager; TLS automation.
- Multi-instance scaling (Redis-backed cache/session, message queue).

---

## Viva Questions & Answers

**Q1. What problem does this project solve?**
Managing multiple clouds means juggling different consoles, APIs, and cost/security models. This platform unifies deployment, monitoring, cost, and security across AWS/Azure/GCP behind one dashboard and a common abstraction.

**Q2. What is the Adapter Pattern and why use it here?**
Each provider implements the same `CloudProvider` interface, so services never depend on a specific cloud SDK. New providers slot in without changing callers; a Multi-Cloud composite aggregates them.

**Q3. How does authentication work?**
A short-lived JWT access token plus a longer-lived, **revocable refresh token** (stored only as a SHA-256 hash, rotated on use). bcrypt hashes passwords; the client auto-refreshes on 401.

**Q4. How is RBAC enforced?**
Role checks via middleware (`authorize`, `authorizeMin`) using a role-rank model; e.g. Terraform `apply` requires Cloud Engineer or above. Public registration cannot self-assign Admin.

**Q5. How do you keep cloud costs near zero?**
Demo Mode (mock/DB-backed adapters), free-tier services (MongoDB Atlas M0), and Terraform templates gated with `enable_compute=false`. The Terraform engine simulates commands by default.

**Q6. How does monitoring work?**
The backend exposes `/metrics` (prom-client): HTTP request count/latency/errors, Node runtime metrics, and business gauges (health, deployments, cost, security). Prometheus scrapes it; Grafana shows six provisioned dashboards.

**Q7. What runs in your CI/CD?**
GitHub Actions: lint, backend Jest (+coverage gate) and frontend Vitest, Docker build validation, CodeQL, Trivy + npm audit, and a deploy workflow that publishes images to GHCR.

**Q8. How is the Terraform automation kept safe?**
It simulates by default (no binary, no cloud calls). Live execution is opt-in (`TERRAFORM_ENABLED`), and apply/destroy need an extra flag (`TERRAFORM_ALLOW_MUTATIONS`) plus a Cloud Engineer+ role.

**Q9. How do you ensure data integrity and auditability?**
Mongoose schema validation + enums, soft delete, and an **append-only, TTL'd audit log** that records logins, deployments, and sensitive actions.

**Q10. What are the main security measures?**
Helmet headers, restricted CORS (no wildcard with credentials), rate limiting (stricter on auth), input validation, bcrypt, required JWT secrets (fail-fast), no stack-trace leakage in production, and dependency scanning.

**Q11. How is the frontend structured?**
React + Vite PWA with Context API (auth/theme/notifications), protected routes by role, reusable UI components, Recharts visualizations, dark mode, and an axios client with JWT refresh.

**Q12. How would you scale this?**
Stateless API behind a load balancer, Redis-backed cache/sessions, MongoDB replica set/sharding, a message queue for long-running jobs, and Prometheus/Grafana for capacity signals.

**Q13. How do you test it?**
Backend: Jest + supertest + mongodb-memory-server (auth, RBAC, dashboard, terraform, adapters) with a coverage threshold gate. Frontend: Vitest + Testing Library render tests.

**Q14. What design patterns are used?**
Adapter (cloud providers), Factory/Registry (provider resolution), Repository (data access), Middleware chain (Express), and a layered architecture.

**Q15. What is the difference between access and refresh tokens here?**
Access tokens are short-lived and sent on every request; refresh tokens are long-lived, stored hashed and revocable, exchanged (and rotated) to obtain new access tokens without re-login.
