# AI-Powered Multi-Cloud Portability & Deployment Automation Platform

> Deploy, monitor, optimize, secure, migrate, and manage applications across **AWS, Azure, and GCP** from one unified, AI-assisted control plane.

[![CI](https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app/actions)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![React](https://img.shields.io/badge/react-18.x-blue)

---

## Overview

An enterprise-grade, **free-tier-friendly** cloud management platform built as a modular monolith with a
pluggable **Cloud Provider Adapter** pattern. Every feature runs locally via Docker Compose, and a built-in
**Demo Mode** seeds realistic data so the platform is fully functional with **zero cloud accounts and near-zero cost**.

### Key capabilities (19 modules)

| Area | Modules |
|------|---------|
| **Identity** | JWT Auth + RBAC (Admin, Cloud Engineer, DevOps Engineer, Viewer) |
| **Visibility** | Multi-Cloud Dashboard, Deployment History, Monitoring Center |
| **AI** | AI Cloud Architect, Incident Analyzer, ChatOps Assistant (Amazon Bedrock / Claude) |
| **Portability** | Portability Analyzer, Migration Advisor |
| **Automation** | Terraform Engine, Docker Engine, Kubernetes Management, One-Click Rollback |
| **Security** | Security Center, Adversarial Security Lab, Compliance Checker |
| **FinOps & Green** | FinOps Dashboard, Green Cloud Score |
| **Showcase** | Portfolio Showcase Page |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router, Recharts, PWA |
| Backend | Node.js 20, Express |
| Database | MongoDB Atlas (M0 free tier) / local Mongo |
| Auth | JWT, bcrypt, RBAC |
| Containers | Docker, Docker Compose |
| IaC | Terraform (AWS / Azure / GCP) |
| Orchestration | Kubernetes (EKS / AKS / GKE views) |
| Monitoring | Prometheus, Grafana |
| CI/CD | GitHub Actions |
| AI | Amazon Bedrock (Claude) with mock fallback |

---

## Monorepo Structure

```
Cloud-portaibility-app/
├── backend/              # Node.js + Express API (layered architecture)
├── frontend/             # React PWA (Tailwind + Recharts)
├── infra/
│   ├── terraform/        # IaC modules for AWS / Azure / GCP
│   └── monitoring/       # Prometheus + Grafana provisioning
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # Architecture & phase documentation
├── legacy/               # Original static demo (preserved)
├── docker-compose.yml    # One-command local stack
└── README.md
```

See [`docs/02-folder-structure.md`](docs/02-folder-structure.md) for the full annotated tree.

---

## Quick Start (Demo Mode — zero cloud cost)

> ⚠️ **Phase 2 status:** This is the project scaffolding. Application code is delivered in later phases.
> The commands below describe the intended developer workflow once implementation lands.

```bash
# 1. Clone
git clone https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app.git
cd Cloud-portaibility-app

# 2. Configure environment (copy templates, defaults run in DEMO_MODE)
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Launch the full stack
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (PWA) | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

### Local development (without Docker)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

---

## Configuration

All configuration is environment-based. Copy the provided `.env.example` files and adjust.

- **Demo Mode** (`DEMO_MODE=true`, default): no cloud credentials required; mock adapters return realistic data.
- **Live Mode**: supply AWS/Azure/GCP credentials and a MongoDB Atlas URI to enable real integrations.

Never commit real `.env` files — only the `.env.example` templates are tracked.

---

## Build Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Architecture Design | ✅ Complete |
| 2 | Folder Structure & Scaffolding | ✅ Complete (this branch) |
| 3 | Database Design | ⏳ Pending |
| 4 | Frontend | ⏳ Pending |
| 5 | Backend | ⏳ Pending |
| 6 | MongoDB Integration | ⏳ Pending |
| 7 | Docker Integration | ⏳ Pending |
| 8 | Terraform Integration | ⏳ Pending |
| 9 | Kubernetes Integration | ⏳ Pending |
| 10 | Security Center | ⏳ Pending |
| 11 | Monitoring | ⏳ Pending |
| 12 | AI Modules | ⏳ Pending |
| 13 | CI/CD Pipeline | ⏳ Pending |
| 14 | Deployment Guide | ⏳ Pending |
| 15 | GitHub Repository Structure | ⏳ Pending |
| 16 | Resume Description | ⏳ Pending |
| 17 | Viva Q&A | ⏳ Pending |

---

## License

MIT — see [`LICENSE`](LICENSE).
