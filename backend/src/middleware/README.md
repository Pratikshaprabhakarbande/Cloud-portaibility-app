# middleware/

Cross-cutting Express middleware.

Planned (Phase 5):
- `auth.js` — verifies JWT, attaches `req.user`.
- `rbac.js` — `authorize(...roles)` guard.
- `validate.js` — express-validator result handler.
- `rateLimit.js` — express-rate-limit config.
- `errorHandler.js` — centralized error responses (no stack leaks).
