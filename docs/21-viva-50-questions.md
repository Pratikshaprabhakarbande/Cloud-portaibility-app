# 50 Viva Questions & Answers

## Architecture & Design
**Q1. What architecture pattern does this project use?**
A modular monolith with a layered architecture (routes → controllers → services → repositories/adapters → models) and a pluggable Cloud Provider Adapter pattern.

**Q2. Why a modular monolith instead of microservices?**
Simplicity for a portfolio project — one deployable, easy to run locally, while the adapter/module boundaries allow future decomposition without changing contracts.

**Q3. What is the Adapter Pattern and why is it the core abstraction?**
Each cloud provider implements a common `CloudProvider` interface. Services never depend on a specific SDK, so new providers slot in without changing callers. A composite `MultiCloudProvider` fans out to all adapters.

**Q4. Explain the backend layered architecture.**
Routes (HTTP binding + middleware) → Controllers (parse request, format response, no logic) → Services (business logic, orchestration) → Repositories (data access) / Adapters (cloud SDKs) → Models (Mongoose schemas).

**Q5. What design patterns are used?**
Adapter, Factory, Registry, Repository, Middleware Chain, Composite, Strategy (advisor engines), and Observer (metrics collector).

## Authentication & Security
**Q6. How does JWT authentication work here?**
A short-lived access token (15m) carries `sub` + `role`; a long-lived refresh token (7d) is signed with a separate secret, stored as a SHA-256 hash, and is single-use (atomic `findOneAndDelete` on rotation).

**Q7. What makes the refresh token single-use?**
`rotateRefreshToken` uses `Token.findOneAndDelete()` — an atomic operation that finds the token record AND deletes it in one step. A second use finds nothing → 401.

**Q8. Why add a `jti` to refresh tokens?**
To guarantee uniqueness even when two tokens are signed within the same second (same payload + same `iat`/`exp` → same bytes without `jti`).

**Q9. How is RBAC implemented?**
`middleware/rbac.js` provides `authorize(...roles)` (explicit list) and `authorizeMin(role)` (rank-based). Roles: Admin > Cloud Engineer > DevOps Engineer > Viewer.

**Q10. How do you prevent privilege escalation on registration?**
`auth.service.js` forces any self-registered user to a non-Admin role regardless of what they send.

**Q11. What is CSRF and how is it handled?**
Cross-Site Request Forgery. When `AUTH_COOKIE_REFRESH=true`, a double-submit cookie check (`x-csrf-token` header = `csrfToken` cookie) protects state-changing requests. Bearer-token requests are immune.

**Q12. How are passwords stored?**
bcrypt with configurable salt rounds; the `password` field is marked `private` (never serialized to JSON).

**Q13. What happens if JWT_SECRET is not set?**
The server throws immediately at startup (`validateEnv` fail-fast) — there is no insecure fallback.

## Cloud & Multi-Cloud
**Q14. How do live cloud adapters work?**
Each provider adapter lazily imports its SDK module only when `DEMO_MODE=false` + credentials exist. Any SDK error falls back to the DB/demo data — the app never crashes.

**Q15. What AWS services are integrated?**
EC2 (DescribeInstances), S3 (ListBuckets), CloudWatch (GetMetricStatistics), Cost Explorer (GetCostAndUsage), Security Groups (DescribeSecurityGroups).

**Q16. How is multi-cloud aggregation done?**
`MultiCloudProvider` receives an array of single-provider adapters, calls each in parallel, and merges counts/costs/findings/health into one unified response.

**Q17. What is Demo Mode?**
`DEMO_MODE=true` (default) → adapters return MongoDB/seed data or deterministic mock data. Zero cloud cost, fully functional for demos.

**Q18. How do you avoid vendor lock-in in this project?**
The adapter interface is cloud-agnostic; services never import a specific SDK directly. The same dashboard/security/cost endpoints work against any provider.

## Terraform
**Q19. How is Terraform automation kept safe?**
Simulated by default (no binary). Live mode requires `TERRAFORM_ENABLED=true`; apply/destroy additionally require `TERRAFORM_ALLOW_MUTATIONS=true` + Cloud Engineer role.

**Q20. What is remote state and why use it?**
Terraform state stored in a shared backend (S3/Azure Storage/GCS) so teams collaborate safely and state isn't lost. Lock tables prevent concurrent modifications.

## Monitoring & Observability
**Q21. What metrics does the backend expose?**
HTTP request count/duration(histogram)/errors, Node.js runtime (CPU, heap, event loop, handles), and business gauges (health, cost, security, deployments, containers, incidents).

**Q22. How are Grafana dashboards provisioned?**
JSON files in `infra/monitoring/grafana/dashboards/` are auto-loaded by the Grafana provisioning folder mount — no manual import needed.

**Q23. What alert rules are defined?**
BackendDown (1m), HighErrorRate (5m), HighRequestLatencyP95 (10m), LowSecurityScore (10m), OpenIncidents (15m).

**Q24. How does log aggregation work?**
Winston JSON → stdout → Promtail (Docker log driver) → Loki → Grafana Explore.

## Database
**Q25. Why MongoDB?**
Flexible schemas match the diverse document structures (reports, configs, findings); Atlas M0 free tier for zero-cost; Mongoose adds validation + plugins.

**Q26. What Mongoose plugins are used?**
`toJSON` (id transformation, private-field stripping), `softDelete` (isDeleted + query filtering), `paginate` (normalized pagination with limit cap).

**Q27. How is soft delete implemented?**
A `pre` hook on read operations auto-adds `isDeleted: { $ne: true }` unless `withDeleted: true` is passed in query options.

**Q28. What is the audit log and why is it immutable?**
`AuditLog` is append-only (blocks updates via a pre hook) with a 365-day TTL index. Records login/deploy/scan/rollback actions for security forensics.

## Frontend
**Q29. How is authentication managed in the SPA?**
`AuthContext` bootstraps from a stored access token, exposes login/register/logout/updateProfile, and an axios interceptor transparently refreshes on 401.

**Q30. How does dark mode work?**
`ThemeContext` toggles the `dark` class on `<html>` (Tailwind's class-based dark mode), persists to localStorage, and respects system preference on first visit.

**Q31. How are routes protected?**
`ProtectedRoute` gates by JWT (shows loader during bootstrap) and optional `roles` array; unauthenticated → `/login`, wrong role → `/unauthorized`.

**Q32. What charting library is used and why?**
Recharts — lightweight, composable React components, built on D3, supports responsive containers natively.

## CI/CD & DevOps
**Q33. What CI checks run on every push?**
Lint (ESLint), backend tests + coverage gate, frontend tests, frontend build, Docker image build validation.

**Q34. What security scanning runs?**
CodeQL (static analysis), Trivy (vulnerability/secret/misconfig filesystem scan), npm audit.

**Q35. How are images deployed?**
The `deploy.yml` workflow builds and pushes to GHCR on pushes to `main` or version tags, using Docker Buildx with GitHub Actions cache.

**Q36. How is Terraform CI gated?**
Manual `workflow_dispatch` only; uses GitHub Environments with required reviewers for apply/destroy.

## Docker
**Q37. How does the stack start locally?**
`cp .env.example .env && docker compose up --build` (5 services: backend, frontend, mongo, prometheus, grafana + optional logging overlay).

**Q38. How is the backend Dockerfile secured?**
Non-root user (`adduser -S app`), `npm install --omit=dev`, healthcheck via wget, `NODE_ENV=production`.

**Q39. What is the production compose overlay?**
`docker-compose.prod.yml` adds an Nginx reverse proxy with TLS termination (port 443), HTTP→HTTPS redirect, HSTS, and edge rate limiting.

## Modules
**Q40. How does the Compliance Checker work?**
It pulls security findings from the cloud adapter and evaluates them against CIS-style control definitions, scoring pass/fail, and persists a ComplianceReport.

**Q41. How does the FinOps Optimizer generate recommendations?**
Rule-based: identifies the highest-cost provider (right-sizing), idle resources (terminate/schedule), and suggests commitment discounts + storage lifecycle.

**Q42. How does the Migration Advisor estimate risk?**
From the source provider's resource count + the number of managed/high-lock-in services. More lock-in → higher risk. Downtime estimate scales with resource count.

**Q43. How does the AI Advisor work without an LLM?**
A `RuleBasedAdvisor` engine consumes live platform context (overview + cost + security + resources + deployments) and emits structured recommendations deterministically.

**Q44. How would you add a real LLM?**
Register a custom advisor via `registerAdvisor('my-llm', () => new MyLlmAdvisor())` using the extension hook in `ai/hooks.js`; or set `AI_PROVIDER=bedrock` + `BEDROCK_ENABLED=true` and complete the `BedrockAdvisor` stub.

## Performance & Scalability
**Q45. How is caching implemented?**
A TTL in-memory cache (`TTLCache`) with optional Redis backing (`REDIS_URL`). `withCache(key, fn, ttl)` memoizes adapter results. Cache is prefix-invalidatable.

**Q46. How would you scale this horizontally?**
Stateless API behind a load balancer; Redis-backed cache/sessions (already configurable); MongoDB replica set; Prometheus service discovery for multiple backend instances.

**Q47. What prevents the metrics collector from overloading the DB?**
It runs on a 30-second interval, queries the same cached data the dashboard uses, and swallows all errors — so it's bounded and non-blocking.

## Testing
**Q48. What types of tests exist?**
Unit (pure functions: helpers, RBAC), integration (supertest + mongodb-memory-server: auth, dashboard, terraform, security, compliance, finops, migration, AI advisor), frontend render (Vitest + Testing Library), E2E (Playwright scaffold), load (k6 scaffold).

**Q49. How are integration tests isolated?**
Each suite creates its own `MongoMemoryServer` instance (in-memory, ephemeral) and dynamic-imports the app module after env is set — completely isolated from other suites.

**Q50. What is the coverage gate?**
Jest `coverageThreshold`: lines/statements ≥ 25%, functions ≥ 20%, branches ≥ 15% (global). CI fails if thresholds aren't met (`npm test -- --coverage`).
