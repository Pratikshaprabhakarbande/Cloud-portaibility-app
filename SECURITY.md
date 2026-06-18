# Security Policy

## Reporting a vulnerability

Please report security issues privately (e.g. a private advisory or direct contact
to the maintainer) rather than opening a public issue. Include reproduction steps
and impact. We aim to acknowledge reports promptly.

## Security posture (current)

Implemented controls:

- **Password hashing** — bcrypt with configurable salt rounds (`backend/src/models/user.model.js`).
- **JWT** — short-lived access tokens + separately-signed, **revocable, rotating**
  refresh tokens stored only as SHA-256 hashes (`utils/jwt.js`, `services/token.service.js`, `models/token.model.js`).
- **Required secrets** — `JWT_SECRET` and `JWT_REFRESH_SECRET` are mandatory; the
  server **fails fast** if they are missing or equal (`config/env.js`). No insecure fallbacks.
- **RBAC** — role checks via `middleware/rbac.js`; public registration cannot grant Admin.
- **CORS** — credentials enabled only with an explicit origin; production requires a
  non-wildcard `CORS_ORIGIN`.
- **Rate limiting** — global limiter + stricter auth limiter (`middleware/rateLimit.js`).
- **Input validation** — express-validator on all write endpoints.
- **Error handling** — centralized; no stack traces leaked in production.
- **Audit logging** — immutable, append-only audit trail with TTL (`models/auditLog.model.js`).
- **Dependency hygiene** — Dependabot + non-blocking `npm audit` in CI.

## Token storage (frontend) — current approach & roadmap

**Current approach.** The SPA stores the access and refresh tokens in
`localStorage` (`frontend/src/services/api.js`). The axios client attaches the
access token and transparently refreshes on `401`. This keeps the stateless,
cross-origin auth flow simple.

**Risk.** `localStorage` is readable by JavaScript, so a successful XSS attack
could exfiltrate tokens. Mitigations in place: Helmet headers, input validation,
React's default output escaping, short access-token lifetime, and revocable
refresh tokens.

**Planned migration (not yet implemented).** Move the **refresh token** to an
`HttpOnly`, `Secure`, `SameSite=Strict` cookie set by the backend on
login/refresh, keeping the short-lived access token in memory:

1. Backend: set/clear the refresh cookie on `login`/`refresh-token`/`logout`
   (e.g. via `res.cookie`), and read it from the cookie on refresh.
2. Frontend: stop persisting the refresh token; rely on the cookie for refresh
   and keep the access token in memory only.
3. Add CSRF protection for cookie-based refresh (double-submit token or
   `SameSite` + custom header).

This change touches the critical auth path and requires running the integration
suite, so it is tracked as a follow-up rather than bundled into this hardening
sprint (to avoid regressions).

## Operational notes

- Never commit real `.env` files — only `.env.example` templates are tracked.
- Rotate `JWT_SECRET`/`JWT_REFRESH_SECRET` if exposure is suspected (invalidates
  existing tokens).
- The legacy `Jenkinsfile`/static demo under `legacy/` is retained for history and
  is not part of the running application.
