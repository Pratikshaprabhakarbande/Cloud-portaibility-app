# Module 3 — Cloud Adapter Layer

A production-ready provider abstraction built with the **Adapter Pattern**, so
every feature interacts with AWS, Azure, GCP, or all of them through one
consistent interface — without knowing which cloud is behind it.

---

## 1. Why

- **Decoupling**: services/controllers never call cloud SDKs directly.
- **Pluggability**: real SDK adapters can replace DB/mock implementations with
  zero changes to callers.
- **Multi-cloud**: a composite adapter aggregates all providers as if it were one.
- **Cost control**: a caching layer reduces repeated provider work.

---

## 2. Structure

```
backend/src/cloud-adapters/
├── CloudProvider.js        # abstract interface (the contract)
├── DbCloudProvider.js      # DB-backed base (Phase 3 models), per-provider scoped
├── aws/AwsProvider.js      # extends DbCloudProvider (live AWS SDK = next module)
├── azure/AzureProvider.js  # extends DbCloudProvider
├── gcp/GcpProvider.js      # extends DbCloudProvider
├── mock/MockProvider.js    # deterministic synthetic data (no DB)
├── MultiCloudProvider.js   # composite — fans out + merges
├── ProviderFactory.js      # singleton registry + scope resolution
├── cache.js                # TTL cache + withCache() memoizer
└── index.js                # barrel
```

---

## 3. The Interface

Every adapter implements six core methods:

| Method | Returns (single provider) |
|--------|---------------------------|
| `getResources()` | `{ provider, total, running, runningContainers, byType, byStatus, items }` |
| `getDeployments()` | `{ provider, total, active, byStatus, byProvider, recent }` |
| `getCostSummary()` | `{ provider, currency, dailyCost, monthlyCost, projectedCost, savings, trends }` |
| `getSecurityFindings()` | `{ provider, securityScore, riskScore, summary, findings }` |
| `getComplianceStatus()` | `{ provider, overall, reports }` |
| `getHealthScore()` | `{ provider, score, status, metrics }` |

`CloudProvider` (the base class) throws a clear "not implemented" error for any
method a concrete adapter forgets to override.

---

## 4. Adapters

- **DbCloudProvider** — serves provider-scoped data from the Phase 3 models
  (`Deployment`, `CloudResource`, `SecurityReport`, `ComplianceReport`,
  `CostReport`). All methods are memoized via the TTL cache.
- **AwsProvider / AzureProvider / GcpProvider** — extend `DbCloudProvider`, set
  their provider key, and detect credentials (`hasCredentials`). They currently
  run in `demo` mode (DB-backed); the **real AWS SDK integration is the next
  module** and will override methods to call live APIs when credentials exist,
  falling back to the DB otherwise.
- **MockProvider** — deterministic synthetic data (seeded by provider key), no
  database required. Ideal for empty-DB demos, UI work, and fast offline tests.
- **MultiCloudProvider** — composite over the three single providers; merges
  counts, sums costs, pivots trends by month, and exposes a per-provider
  breakdown. Reports `provider: "multi-cloud"`.

---

## 5. Factory & Registry

`providerFactory` (singleton) maintains lazily-created singleton adapters and
resolves a **scope** string:

| Scope | Result |
|-------|--------|
| `aws` / `azure` / `gcp` | that single adapter |
| `mock` | the synthetic `MockProvider` |
| `multi-cloud` (aliases `multi`, `all`, empty/undefined) | `MultiCloudProvider` over all three |

API:
- `providerFactory.get(scope)` → an adapter (single or composite).
- `providerFactory.resolveProviders(scope)` → array of single adapters (for iteration).
- `providerFactory.isValidScope(scope)` → boolean.
- `providerFactory.describe()` → registry + cache diagnostics.

---

## 6. Caching

`cache.js` provides a single-process `TTLCache` and `withCache(key, fn, ttl)`:

- Keys are namespaced per `provider:mode:method`.
- TTL is configurable (`CACHE_TTL_MS`, default 30s).
- Disabled automatically in tests (`CACHE_ENABLED=false` when `NODE_ENV=test`).
- `invalidate(prefix)` clears a provider's cache (e.g. `"aws:"`) after a write.
- In a multi-instance deployment this would be swapped for Redis; the
  `withCache` API stays the same.

---

## 7. Provider Switching in the Dashboard

All dashboard endpoints accept an optional `?provider=` scope and route through
the adapter layer:

```
GET /api/dashboard/overview?provider=aws          # single provider
GET /api/dashboard/overview?provider=multi-cloud  # aggregated (default)
GET /api/dashboard/health-score?provider=mock     # synthetic
```

Invalid scopes are rejected with `400`. The frontend dashboard includes a
segmented **Multi-Cloud / AWS / Azure / GCP** switcher that re-fetches the
overview and charts for the selected scope.

---

## 8. Audit Logging & Error Handling

- Provider/scope is recorded in the dashboard overview audit entry.
- Unknown scopes raise an operational `ApiError(400)` handled by the centralized
  error pipeline (no stack leaks in production).
- Adapter methods are read-only; failures surface as `500` via the error handler.

---

## 9. Testing

```bash
cd backend && npm install && npm test
```

- **Unit** (`tests/unit/cloudAdapters.test.js`, no DB):
  - `TTLCache` set/get, expiry, prefix invalidation, hit/miss stats.
  - `MockProvider` — all six methods + health bounds.
  - `ProviderFactory` — scope resolution, validation, unknown-scope error.
  - `MultiCloudProvider` — aggregation correctness (totals, cost merge, health breakdown).
- **Integration** (`tests/integration/dashboard.test.js`, in-memory MongoDB):
  - `?provider=aws` scopes to one provider; `multi-cloud` aggregates three;
    `mock` serves synthetic data; invalid scope → `400`.

> The dependency-free adapters (MockProvider, MultiCloudProvider) were also
> executed directly in the build environment and all assertions passed.

---

## 10. Roadmap

The AWS/Azure/GCP adapters are SDK-ready: the **real AWS integration** (next
module) implements live `getResources`/`getCostSummary`/`getSecurityFindings`
against AWS APIs, gated by credentials, with the DB-backed methods as fallback.
