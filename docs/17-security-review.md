# Security Review

A consolidated review of the platform's security posture and the production
hardening added in this phase.

## Authentication & sessions
- **Password hashing:** bcrypt with configurable salt rounds; password never serialized (`private` field).
- **JWT:** short-lived access token + long-lived refresh token signed with a **separate secret**; unique `jti` per refresh token; refresh tokens stored as **SHA-256 hashes** and **single-use** (atomic `findOneAndDelete` on rotation).
- **HttpOnly cookie option (new):** `AUTH_COOKIE_REFRESH=true` stores the refresh token in an `HttpOnly`, `Secure`, `SameSite` cookie (scoped to `/api/auth`), reducing XSS token theft. Default OFF for backward compatibility; the Bearer flow is unchanged.
- **CSRF (new):** double-submit cookie check (`x-csrf-token` header vs `csrfToken` cookie) enforced only for cookie-authenticated, state-changing requests; Bearer requests are exempt (not CSRF-prone).
- **Required secrets:** server fails fast if `JWT_SECRET`/`JWT_REFRESH_SECRET` are missing or equal.

## Authorization
- **RBAC** via `authorize`/`authorizeMin` (4 roles); public registration cannot self-assign Admin; mutating Terraform actions require Cloud Engineer+; sensitive Security Center endpoints require Cloud Engineer+.
- **Audit log:** immutable, append-only, TTL-retained record of logins, deploys, scans, etc.

## Transport & headers
- **TLS** terminated by the Nginx reverse proxy (TLS 1.2/1.3) with HTTP→HTTPS redirect and **HSTS**; `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` set at the edge.
- **Helmet** sets secure headers on app responses; **CORS** never uses a wildcard with credentials and requires an explicit origin in production.

## Input & rate limiting
- **express-validator** on every write endpoint; centralized error handler (no stack traces in production).
- **Rate limiting:** global limiter + stricter auth limiter (brute-force mitigation); edge rate limiting in Nginx.

## Supply chain & CI
- **CodeQL** static analysis, **Trivy** filesystem scan, **npm audit**, **Dependabot** weekly updates.
- Reproducible installs via `npm ci` once lockfiles are committed (see `docs/12-lockfiles.md`).

## Caching & data
- Optional **Redis** cache layer with automatic in-memory fallback (no single point of failure for caching).
- MongoDB schema validation, soft delete, and ownership/audit fields.

## Cloud integrations
- Live AWS/Azure/GCP calls are **read-only**, **credential-gated**, and **lazily imported**; any failure falls back to demo data. No resources are created/modified by the read paths.

## Known limitations / follow-ups
- Cookie/CSRF mode is opt-in; enable + test before relying on it in production.
- Secrets are env-based; integrate a secrets manager (AWS Secrets Manager / Vault) for production.
- Live cloud adapters are code-complete but require validation against real accounts.
- Add automated dependency/lockfile pinning (commit lockfiles) and image signing.
- Penetration testing and a formal threat model are recommended before GA.

## Quick hardening checklist
- [x] bcrypt, JWT rotation (single-use refresh), RBAC, audit log
- [x] Helmet, CORS lock-down, rate limiting, input validation
- [x] TLS/HSTS via reverse proxy
- [x] HttpOnly cookie + CSRF option
- [x] CodeQL + Trivy + npm audit + Dependabot
- [ ] Secrets manager integration
- [ ] Commit lockfiles + image signing
- [ ] External pen-test
