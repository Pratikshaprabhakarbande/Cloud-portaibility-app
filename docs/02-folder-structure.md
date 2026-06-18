# Phase 2 — Folder Structure & Scaffolding

This document describes the complete production folder structure created in Phase 2.
No application logic is implemented yet — this phase delivers the **skeleton, configuration, and tooling** only.

## Top-level layout

```
Cloud-portaibility-app/
├── README.md                     # Project overview & quick start
├── LICENSE                       # MIT
├── .gitignore                    # Ignores secrets, builds, terraform state, etc.
├── .env.example                  # Root env template (compose)
├── package.json                  # Monorepo workspace orchestration scripts
├── docker-compose.yml            # One-command full local stack
│
├── docs/                         # Documentation per phase
│   ├── 01-architecture-design.md
│   └── 02-folder-structure.md
│
├── legacy/                       # Original static demo (preserved)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── Dockerfile.legacy
│   └── Jenkinsfile.legacy
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # Lint + test + build on PR/push
│       └── codeql.yml            # Security static analysis
│
├── backend/                      # Node.js + Express API (see below)
├── frontend/                     # React PWA (see below)
└── infra/                        # IaC + monitoring (see below)
```

## Backend (`backend/`)

Layered architecture — each layer has a single responsibility.

```
backend/
├── package.json                  # Deps + scripts (dev/start/test/lint)
├── .env.example                  # Backend env template
├── .eslintrc.json                # Lint rules
├── .dockerignore
├── Dockerfile                    # Production image (Node 20 alpine)
├── jest.config.js                # Test runner config
├── src/
│   ├── index.js                  # Process entry (loads env, starts server)
│   ├── app.js                    # Express app assembly (middleware + routes)
│   ├── config/                   # env loading, db connection, constants
│   ├── routes/                   # Route definitions per module
│   ├── controllers/              # HTTP request/response handling
│   ├── services/                 # Business logic, orchestration
│   ├── models/                   # Mongoose schemas
│   ├── middleware/               # auth, rbac, validation, errorHandler, rateLimit
│   ├── cloud-adapters/           # Provider Adapter pattern
│   │   ├── index.js              # ProviderFactory
│   │   ├── CloudProvider.js      # Interface/base class
│   │   ├── aws/                  # AWS adapter (implemented first)
│   │   ├── azure/                # Azure adapter
│   │   ├── gcp/                  # GCP adapter
│   │   └── mock/                 # Demo Mode adapter
│   ├── ai/                       # Bedrock/Claude client + prompt templates + mock
│   └── utils/                    # logger, response helpers, errors
└── tests/                        # Unit & integration tests
    ├── unit/
    └── integration/
```

## Frontend (`frontend/`)

> Implementation begins in Phase 4. This phase only creates the structure and config.

```
frontend/
├── package.json                  # React + Vite + Tailwind + Recharts deps
├── .env.example                  # Frontend env template (VITE_ vars)
├── .eslintrc.json
├── .dockerignore
├── Dockerfile                    # Multi-stage build → Nginx static serve
├── nginx.conf                    # SPA routing + gzip
├── vite.config.js                # Build + PWA plugin config
├── tailwind.config.js
├── postcss.config.js
├── index.html                    # SPA shell
├── public/
│   ├── manifest.webmanifest      # PWA manifest
│   ├── robots.txt
│   └── icons/                    # PWA icons (placeholder)
└── src/
    ├── main.jsx                  # React entry (placeholder)
    ├── App.jsx                   # Router shell (placeholder)
    ├── assets/                   # Images, styles
    ├── components/               # Reusable UI (cards, charts, layout)
    ├── pages/                    # Login, Register, Profile, Settings, Showcase
    ├── modules/                  # Feature modules (dashboard, security, finops...)
    ├── context/                  # Auth/session context
    ├── hooks/                    # Custom hooks
    ├── routes/                   # Route config + protected routes
    └── services/                 # API client (axios)
```

## Infrastructure (`infra/`)

```
infra/
├── terraform/
│   ├── aws/                      # AWS root module (free-tier friendly)
│   ├── azure/                    # Azure root module
│   ├── gcp/                      # GCP root module
│   └── modules/                  # Shared reusable modules
│       ├── network/
│       └── compute/
└── monitoring/
    ├── prometheus/
    │   └── prometheus.yml        # Scrape config (targets backend /metrics)
    └── grafana/
        ├── provisioning/
        │   ├── datasources/      # Prometheus datasource
        │   └── dashboards/       # Dashboard provider config
        └── dashboards/           # JSON dashboard definitions
```

## Conventions

- **Secrets**: only `.env.example` templates are committed; real `.env` files are git-ignored.
- **Demo Mode**: `DEMO_MODE=true` by default → mock adapters, no cloud charges.
- **AWS-first**: AWS adapter/Terraform implemented before Azure & GCP.
- **Placeholders**: empty directories contain a `.gitkeep` so the structure is tracked in git.
