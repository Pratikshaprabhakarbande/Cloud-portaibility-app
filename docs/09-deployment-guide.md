# Installation & Deployment Guide

## Prerequisites

- Node.js 20+
- Docker + Docker Compose v2
- MongoDB (local container via compose, or a free MongoDB Atlas M0 cluster)
- (Optional) Terraform CLI — only if you enable live IaC execution

---

## 1. Local — Docker Compose (recommended)

```bash
git clone https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app.git
cd Cloud-portaibility-app
git checkout feature/platform-rebuild

# Secrets are REQUIRED (the backend fails fast without them).
cp .env.example .env            # contains dev-only JWT secrets to start

docker compose up --build

# (optional) seed demo data so dashboards/metrics are populated
docker compose exec backend npm run seed
```

| Service | URL |
|---------|-----|
| Frontend (PWA) | http://localhost:3000 |
| Backend health | http://localhost:5000/api/health |
| Metrics | http://localhost:5000/metrics |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

Stop & clean: `docker compose down -v`.

---

## 2. Local — without Docker

```bash
# Backend (set JWT secrets + MONGO_URI in backend/.env)
cd backend && npm install && npm run dev      # http://localhost:5000

# Frontend
cd frontend && npm install && npm run dev      # http://localhost:3000
```

In development the API starts even if MongoDB is unreachable (DB-backed routes
then return errors); supply a reachable `MONGO_URI` for full functionality.

---

## 3. MongoDB Atlas (free tier)

1. Create an M0 cluster at https://www.mongodb.com/atlas.
2. Add a database user and allow your IP.
3. Copy the connection string into `MONGO_URI` (backend env), e.g.
   `mongodb+srv://<user>:<pass>@<cluster>/cloudportability`.

---

## 4. Production deployment

### Secrets & config
- Set strong, distinct `JWT_SECRET` and `JWT_REFRESH_SECRET`
  (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- Set `NODE_ENV=production`, an explicit non-wildcard `CORS_ORIGIN`, and `MONGO_URI`.
  The backend refuses to start otherwise.

### Container images (CI/CD)
The **Deploy** workflow (`.github/workflows/deploy.yml`) builds and pushes images
to GHCR on pushes to `main`, version tags (`v*`), or manual dispatch:

```
ghcr.io/<owner>/cloud-portaibility-app-backend:<tag>
ghcr.io/<owner>/cloud-portaibility-app-frontend:<tag>
```

Pull and run them on any container host (VM, ECS, AKS, GKE, Fly, Render, etc.).

### Reverse proxy / TLS
Terminate TLS at a reverse proxy (Nginx/Traefik/cloud LB) in front of the
frontend and backend. Forward `/api` to the backend and everything else to the
frontend. Enable HSTS at the proxy.

### Monitoring in production
Point a managed/self-hosted Prometheus at the backend `/metrics`, and import the
dashboards from `infra/monitoring/grafana/dashboards/`.

---

## 5. Terraform (IaC) — optional, opt-in

By default the Terraform engine **simulates** commands (no binary, no cloud, no
cost). To run real commands:

```bash
# backend env
TERRAFORM_ENABLED=true
TERRAFORM_ALLOW_MUTATIONS=true   # only if you intend apply/destroy
```

Templates default to `enable_compute=false`, so plans create nothing unless you
opt in. See [`07-terraform-automation.md`](07-terraform-automation.md).

---

## 6. CI/CD

- `ci.yml` — lint, tests (+coverage gate), frontend build, Docker build validation.
- `security-scan.yml` — npm audit + Trivy filesystem scan (non-blocking).
- `codeql.yml` — static security analysis.
- `deploy.yml` — GHCR image build/push (main/tags/dispatch).

---

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `docker compose up` fails on a secret | run `cp .env.example .env` first |
| Backend exits on boot in prod | set `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MONGO_URI`, explicit `CORS_ORIGIN` |
| Dashboard shows zeros | seed data: `docker compose exec backend npm run seed` |
| Prometheus target DOWN | check backend health + `/metrics` |
