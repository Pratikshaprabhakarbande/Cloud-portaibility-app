# Phase 4 — Authentication & Authorization System

Production-ready auth for the platform: JWT (access + rotating refresh tokens),
bcrypt password hashing, RBAC, password reset, and an audit trail.

---

## 1. Architecture

```
routes/auth.routes.js
  → middleware (rateLimit → validate → authenticate?)
    → controllers/auth.controller.js   (HTTP layer)
      → services/auth.service.js        (business logic + audit)
        → services/token.service.js     (issue / rotate / revoke tokens)
        → repositories/UserRepository   (persistence)
```

- **Access token**: short-lived JWT (`JWT_ACCESS_EXPIRES_IN`, default `15m`), carries `sub` + `role`.
- **Refresh token**: long-lived JWT (`JWT_REFRESH_EXPIRES_IN`, default `7d`), signed with a **separate secret**, stored **hashed** in the `tokens` collection so it can be revoked. Rotated on every refresh.
- **Reset token**: random 32-byte token, stored hashed, single-use, expires in `JWT_RESET_EXPIRES_MIN` (default `15m`).

---

## 2. Roles (RBAC)

| Role | Rank |
|------|------|
| Viewer | 1 |
| DevOps Engineer | 2 |
| Cloud Engineer | 3 |
| Admin | 4 |

Guards (in `middleware/rbac.js`):
- `authorize(...roles)` — explicit allow-list.
- `authorizeMin(role)` — that role or higher rank.

> Public registration cannot grant **Admin** (privilege-escalation guard in the service).

---

## 3. API Reference

Base path: `/api/auth` · All bodies are JSON · Success envelope: `{ success, message, data }`.

### POST `/register`  _(public)_
```json
{ "name": "Ada Lovelace", "email": "ada@demo.io", "password": "Str0ngPass", "organization": "Acme" }
```
**201** → `{ data: { user, tokens: { accessToken, refreshToken, tokenType, expiresIn } } }`

### POST `/login`  _(public)_
```json
{ "email": "admin@demo.io", "password": "Admin@12345" }
```
**200** → `{ data: { user, tokens } }`

### POST `/refresh-token`  _(public)_
```json
{ "refreshToken": "<jwt>" }
```
**200** → `{ data: { tokens } }` — old refresh token is revoked (rotation).

### POST `/logout`  _(auth)_  — header `Authorization: Bearer <accessToken>`
```json
{ "refreshToken": "<jwt>" }
```
**200** → revokes the supplied refresh token.

### GET `/profile`  _(auth)_
**200** → `{ data: { user } }`

### PUT `/profile`  _(auth)_
```json
{ "name": "New Name", "preferences": { "theme": "dark" } }
```
Optional password change:
```json
{ "currentPassword": "Old@12345", "newPassword": "New@67890" }
```
**200** → updated user. Changing the password revokes all refresh tokens.

### POST `/forgot-password`  _(public)_
```json
{ "email": "ada@demo.io" }
```
**200** → always generic (no user enumeration). In non-production the response includes `resetToken` for testing/demo.

### POST `/reset-password`  _(public)_
```json
{ "token": "<resetToken>", "password": "BrandN3wPass" }
```
**200** → password reset; all sessions invalidated.

---

## 4. Error Responses

Centralized handler returns:
```json
{ "success": false, "message": "Validation failed", "errors": [ { "field": "email", "message": "A valid email is required" } ] }
```
- `400` validation / bad input · `401` auth failure · `403` deactivated / forbidden role · `404` not found · `409` duplicate email · `429` rate limited · `500` server error (message hidden in production; no stack traces leaked).

---

## 5. Security Practices

| Concern | Mitigation |
|--------|------------|
| Password storage | bcrypt with configurable salt rounds; never serialized (`private` field) |
| Token theft | short access TTL; refresh tokens hashed at rest + rotated + revocable |
| Brute force | `authLimiter` (10 failed attempts / 15 min) on auth endpoints |
| User enumeration | uniform login error; generic forgot-password response |
| Headers | Helmet; CORS restricted to `CORS_ORIGIN` |
| Privilege escalation | public registration forced to non-admin role |
| Input safety | express-validator on every write endpoint |
| Auditing | login/logout/register/update recorded in `audit_logs` |
| Session invalidation | password change/reset revokes all refresh tokens |

---

## 6. Configuration (env)

```
JWT_SECRET=...               # access token secret
JWT_REFRESH_SECRET=...        # refresh token secret (different!)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_RESET_EXPIRES_MIN=15
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

In production the server refuses to start with default/missing `JWT_SECRET` or `JWT_REFRESH_SECRET`.

---

## 7. Manual Test (curl)

```bash
# Login (after `npm run seed`)
curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.io","password":"Admin@12345"}'

# Use the accessToken
curl -s http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```
