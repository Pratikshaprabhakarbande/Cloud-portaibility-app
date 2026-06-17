# Lockfiles & Reproducible Installs

## Status

CI installs use **`npm ci || npm install`**:
- When a committed `package-lock.json` exists, `npm ci` runs (reproducible, fast, integrity-checked).
- Otherwise it falls back to `npm install` so the pipeline never fails on a missing lockfile.

> The environment that authored this repository runs with the public npm registry
> blocked, so lockfiles cannot be generated here. Generate and commit them once
> from any machine/CI with registry access (steps below); `npm ci` then takes over
> automatically — no workflow change required.

## Generate & commit lockfiles (registry-enabled environment)

```bash
# Backend
cd backend
npm install --package-lock-only        # or a full `npm install`
git add package-lock.json

# Frontend
cd ../frontend
npm install --package-lock-only
git add package-lock.json

cd ..
git commit -m "build: add package-lock.json for reproducible npm ci installs"
git push
```

## Optional: enforce strict `npm ci`

After lockfiles are committed and verified green, you may replace the fallback
with a strict step for guaranteed reproducibility:

```yaml
- name: Install dependencies
  run: npm ci
```

## Notes

- Docker images already install at build time; once lockfiles exist, switch the
  Dockerfiles to `npm ci --omit=dev` (backend) / `npm ci` (frontend) for
  reproducible image builds.
- Dependabot is configured (`.github/dependabot.yml`) to keep dependencies and
  lockfiles updated weekly once they are committed.
