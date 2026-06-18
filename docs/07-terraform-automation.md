# Phase 1 — Terraform Automation Engine

Infrastructure-as-Code automation with a **safe-by-default** execution model and
full deployment-history tracking. Implemented on top of the existing layered
backend and the `Deployment` model — no architecture changes, nothing removed.

---

## Safety model (read first)

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Simulated** (default) | `TERRAFORM_ENABLED=false` | Commands are simulated deterministically. **No** terraform binary, **no** cloud calls, **no** billable resources. Safe for demos, CI, and offline use. |
| **Live** | `TERRAFORM_ENABLED=true` | Runs the real `terraform` CLI against `infra/terraform/<provider>`. |
| **Live + mutations** | `TERRAFORM_ENABLED=true` **and** `TERRAFORM_ALLOW_MUTATIONS=true` | Required to permit `apply`/`destroy`. Without it, mutating actions are refused (403). |

All Terraform templates ship with `enable_compute = false`, so even live plans
create nothing unless explicitly opted in.

---

## API

Base path `/api/terraform` (JWT required). RBAC via role rank:

| Method | Path | Min role |
|--------|------|----------|
| POST | `/init` | DevOps Engineer |
| POST | `/validate` | DevOps Engineer |
| POST | `/plan` | DevOps Engineer |
| POST | `/apply` | Cloud Engineer |
| POST | `/destroy` | Cloud Engineer |
| GET | `/history` | any authenticated role |

Request body: `{ "provider": "aws" | "azure" | "gcp" }`.

Response (`data`): `{ id, provider, action, mode, status, durationMs, timestamp, logs }`.

```bash
curl -X POST http://localhost:5000/api/terraform/plan \
  -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' \
  -d '{"provider":"aws"}'
```

---

## Deployment history tracking

Every command is persisted via the existing `Deployment` model
(`type='terraform'`) capturing: **deployment id, provider, action, mode, status,
logs (bounded), timestamps, duration, and the acting user**. History is queryable
at `GET /api/terraform/history?provider=&status=&page=&limit=` and also surfaces
in the dashboard's deployment views. Each action additionally writes an immutable
**audit log** entry.

---

## IaC folder structure (`infra/terraform/`)

```
infra/terraform/
├── aws/ azure/ gcp/      # provider roots (providers, variables, main, outputs)
├── modules/              # reusable modules (network, compute)
├── networking/           # network primitives intent
├── monitoring/           # cloud-managed monitoring intent
├── security/             # IAM/encryption guardrail intent
├── variables/            # shared variable declarations (common.tf)
├── outputs/              # shared output conventions
└── environments/         # dev/staging/prod *.tfvars.example (enable_compute=false)
```

> IaC lives under `infra/terraform/` (the established location) — extended here
> rather than duplicated at the repo root, per the "avoid duplication" principle.

---

## Configuration (env)

```
TERRAFORM_ENABLED=false          # default: simulate
TERRAFORM_BIN=terraform
TERRAFORM_ROOT=../infra/terraform
TERRAFORM_ALLOW_MUTATIONS=false  # extra guard for apply/destroy in live mode
```

## Files

```
backend/src/services/terraform.service.js       # engine (simulate + live CLI) + history
backend/src/controllers/terraform.controller.js # HTTP + audit logging
backend/src/routes/terraform.routes.js           # routes + RBAC (mounted in routes/index.js)
backend/src/validations/terraform.validation.js  # input validation
backend/tests/integration/terraform.test.js       # RBAC + simulation + history tests
infra/terraform/{variables,outputs,networking,monitoring,security,environments}/
```

## Testing

`cd backend && npm test` — `terraform.test.js` verifies RBAC (Viewer 403, DevOps
plan, Cloud Engineer apply, Admin destroy), simulation output, invalid-provider
400, unauth 401, and history recording. Runs fully offline (simulation mode).
