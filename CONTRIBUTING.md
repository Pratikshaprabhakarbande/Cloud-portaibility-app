# Contributing

Thanks for your interest in improving the Multi-Cloud Portability & Deployment Platform.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose (for the full local stack)
- A MongoDB instance (local container via compose, or MongoDB Atlas M0)

## Getting started

```bash
git clone https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app.git
cd Cloud-portaibility-app

# Environment (required: JWT secrets — see README env table)
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Option A: full stack
docker compose up --build

# Option B: local dev
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Project layout

- `backend/` — Node.js + Express API (layered: routes → controllers → services → repositories/adapters → models)
- `frontend/` — React (Vite) PWA
- `infra/` — Terraform scaffolding + Prometheus/Grafana provisioning
- `docs/` — architecture & module documentation, `openapi.yaml`

## Coding standards

- **Lint:** `npm run lint` (backend & frontend). Fix warnings where reasonable.
- **Tests:**
  - Backend: `cd backend && npm test` (Jest + supertest + mongodb-memory-server). Coverage gate runs in CI (`npm test -- --coverage`).
  - Frontend: `cd frontend && npm test` (Vitest + Testing Library).
- **Conventions:** ESM modules, async/await, no business logic in controllers, validation on every write endpoint, secrets only via env.
- Add/adjust tests for any behavior change.

## Commits & PRs

- Use focused commits with clear messages (e.g. `area: short summary`).
- Open PRs against `main`. Ensure **CI is green** (lint, tests, coverage, Docker build, CodeQL).
- Describe what changed, how it was tested, and any limitations.
- Do not commit secrets or `.env` files (only `.env.example` is tracked).

## Reporting security issues

See [`SECURITY.md`](SECURITY.md). Please do **not** open public issues for vulnerabilities.
