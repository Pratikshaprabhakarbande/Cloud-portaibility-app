# Module 2 — Multi-Cloud Dashboard (Backend Endpoints)

Production backend APIs that power the dashboard, aggregating live data from the
Phase 3 Mongoose models. The frontend dashboard is now fully API-driven (no demo
data).

---

## 1. Architecture

```
routes/dashboard.routes.js   (authenticate → validate → controller)
  → controllers/dashboard.controller.js     (HTTP + audit log)
    → services/dashboard.service.js          (DB aggregations)
      → services/dashboard.helpers.js        (pure scoring/shaping — unit tested)
      → models/*  &  repositories/DeploymentRepository
```

- **Auth**: every endpoint requires a valid JWT (`authenticate`). Dashboard data
  is read-only and available to all roles (Admin, Cloud Engineer, DevOps, Viewer).
- **Validation**: query params validated with express-validator.
- **Audit**: viewing the composite overview records a `read` entry in `audit_logs`.
- **Errors**: handled by the centralized error pipeline (Phase 4).

---

## 2. Endpoints

Base path: `/api/dashboard` · Envelope: `{ success, message, data }`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/overview` | Composite: provider cards + summary KPIs + recent deployments |
| GET | `/charts` | Composite: deployment trends, cloud usage, resource utilization, cost trends |
| GET | `/health-score` | Cloud health score (overall + per provider) |
| GET | `/deployments/stats` | Totals, counts by status/provider, success rate |
| GET | `/deployments/trends` | Time series `?days=1..90&provider=` |
| GET | `/deployments` | History with `?page&limit&sort&search&provider&status&type` |
| GET | `/resource-utilization` | Resource inventory + modeled CPU/Mem/Net series |
| GET | `/cost-summary` | Daily/monthly/projected totals, breakdown, trends, savings |
| GET | `/security-summary` | Security & risk scores + finding counts per provider |
| GET | `/compliance-summary` | Compliance scores per provider/framework |

### Example: `GET /api/dashboard/overview`
```json
{
  "success": true,
  "message": "Dashboard overview",
  "data": {
    "providers": [
      { "key": "aws", "name": "AWS", "region": "us-east-1", "status": "operational",
        "healthScore": 88, "activeDeployments": 8, "runningContainers": 3 }
    ],
    "summary": {
      "activeDeployments": 16, "runningContainers": 5, "cloudHealthScore": 86,
      "monthlyCost": 230, "costChangePct": 6.2, "openIncidents": 1, "securityScore": 80
    },
    "recentDeployments": [
      { "id": "...", "name": "payments-api", "provider": "aws", "type": "terraform",
        "status": "success", "version": 2, "user": "Devi DevOps", "createdAt": "..." }
    ]
  }
}
```

---

## 3. Scoring Model

**Provider health (0–100)** = weighted blend of:
- Deployment success rate — 40%
- Latest security score — 30%
- Latest compliance score — 30%

Missing metrics are dropped and remaining weights renormalized; default `90` when
no signal exists. Status thresholds: `≥85 operational`, `≥70 degraded`, else `outage`.

**Deployment success rate** = `success / (success + failed + rolled_back)` (terminal outcomes only).

**Cost change %** = month-over-month change of summed provider monthly cost.

**Resource utilization** — until Prometheus integration (Phase 11), the CPU/Mem/Net
series is **modeled** from the running-resource ratio using a deterministic diurnal
curve (response includes `"source": "modeled"`). Inventory counts (by type/status/
provider) are real.

---

## 4. Filtering, Search & Pagination

`GET /api/dashboard/deployments` (backed by `DeploymentRepository.history`):

| Param | Notes |
|-------|-------|
| `page` | default 1 |
| `limit` | default 20, max 100 |
| `sort` | e.g. `-createdAt` |
| `search` | full-text on deployment `name` |
| `provider` | `aws` \| `azure` \| `gcp` |
| `status` | deployment status enum |
| `type` | `terraform` \| `docker` \| `kubernetes` \| `manual` |

Response: `{ results, page, limit, totalResults, totalPages, hasPrevPage, hasNextPage }`.

---

## 5. Frontend Integration

- `frontend/src/services/dashboard.service.js` now calls the real endpoints
  (`/dashboard/overview`, `/dashboard/charts`, …) — the demo dataset was removed.
- `Dashboard.jsx` consumes `getOverview()` + `getCharts()` via the `useApi` hook,
  with loading skeletons and error/retry states already wired.
- The axios client attaches the JWT and refreshes on 401, so the dashboard works
  for any logged-in role.

---

## 6. Testing

```bash
cd backend
npm install        # installs jest, supertest, mongodb-memory-server
npm test
```

- **Unit** (`tests/unit/dashboard.helpers.test.js`): pure scoring/shaping functions
  (no DB) — success rate, health weighting, status thresholds, change %, usage
  share, trend reshaping, utilization series.
- **Integration** (`tests/integration/dashboard.test.js`): spins up an in-memory
  MongoDB, seeds a user + deployments + cost/security reports, signs a JWT, and
  exercises the routes via supertest — verifying auth (401), overview shape,
  health score, deployment stats/success rate, cost summary, and history
  pagination + invalid-filter (400).

> Note: integration tests require internet on first run (mongodb-memory-server
> downloads the mongod binary) and run in CI. The pure helper logic was also
> verified directly in this environment.

---

## 7. Files

```
backend/src/services/dashboard.service.js
backend/src/services/dashboard.helpers.js
backend/src/controllers/dashboard.controller.js
backend/src/validations/dashboard.validation.js
backend/src/routes/dashboard.routes.js        (mounted in routes/index.js)
backend/tests/unit/dashboard.helpers.test.js
backend/tests/integration/dashboard.test.js
frontend/src/services/dashboard.service.js     (now API-driven)
```
