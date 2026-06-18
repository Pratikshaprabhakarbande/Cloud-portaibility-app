# Phase 5 — React Frontend

Production-ready React SPA: React Router, Tailwind (dark mode), Recharts, Axios,
and Context API. Mobile-first, responsive, and wired to the backend auth APIs.

---

## Stack & Structure

```
frontend/src/
├── main.jsx                # entry: ThemeProvider → NotificationProvider → AuthProvider → App
├── App.jsx                 # routes (public-only / protected / role-gated)
├── index.css               # Tailwind + component classes (.card .btn .input ...)
├── config/                 # roles.js, navigation.js (role-based nav)
├── context/                # AuthContext, ThemeContext, NotificationContext
├── hooks/                  # useAuth, useTheme, useNotification, useApi
├── services/               # api.js (axios + JWT refresh), auth.service, dashboard.service
├── data/                   # demoData.js (dashboard demo dataset)
├── routes/                 # ProtectedRoute, PublicOnlyRoute
├── components/
│   ├── ui/                 # StatCard, CloudProviderCard, HealthScoreCard, CostCard,
│   │                       #   DeploymentTable, Badge, Icon, Loading, ErrorState
│   ├── charts/             # DeploymentTrends, CloudUsage, ResourceUtilization, CostTrends
│   └── layout/             # Sidebar, Navbar, NotificationArea, Layout
└── pages/
    ├── auth/               # Login, Register, ForgotPassword, ResetPassword, AuthLayout
    ├── Dashboard.jsx       # multi-cloud dashboard
    ├── Profile.jsx, Settings.jsx
    └── ComingSoon, Unauthorized, NotFound
```

## Authentication integration

- `services/api.js` — axios instance that attaches the access token and, on a
  `401`, **transparently refreshes** the token once (shared in-flight promise)
  and retries; on failure it clears tokens and redirects to `/login`.
- `AuthContext` — bootstraps the session from a stored token (calls
  `GET /auth/profile`), and exposes `login`, `register`, `logout`, `updateProfile`.
- Tokens are persisted via a small `tokenStore` (localStorage).
- Maps to backend endpoints: register, login, logout, profile (get/update),
  forgot-password, reset-password.

## Routing & RBAC

- `ProtectedRoute` — gates by JWT and optional `roles`; shows a loader during
  auth bootstrap; redirects unauthenticated → `/login`, wrong role → `/unauthorized`.
- `PublicOnlyRoute` — keeps authenticated users out of the auth screens.
- Sidebar navigation is filtered per role via `navForRole(role)`.
- Modules not yet built render a `ComingSoon` placeholder but keep correct
  access control (AI/Terraform/K8s/Migration = non-viewer; User Management = Admin).

## Dashboard (Module 2)

- AWS / Azure / GCP **provider status cards** (health bar, deployments, containers).
- KPI **StatCards** (active deployments, running containers, security score, monthly cost).
- **HealthScoreCard** (circular gauge) and **CostCard** (spend + provider split).
- **Charts**: Deployment Trends (bar), Cloud Usage (pie), Resource Utilization
  (line), Cost Trends (area).
- **DeploymentTable** (responsive: table on desktop, stacked cards on mobile).
- Data flows through `dashboardService` which currently returns the demo dataset;
  switching to live endpoints is a one-line change per method.

## UX

- **Dark mode**: class-based (`darkMode: 'class'`), persisted, respects system
  preference; toggle in the navbar.
- **Responsive**: mobile-first; sidebar becomes a slide-over with backdrop on small screens.
- **Toasts**: `useNotification().notify.success/error/info/warning(...)`.
- **PWA**: configured in `vite.config.js` (vite-plugin-pwa) + manifest.

## Run

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000  (proxy/API → VITE_API_BASE_URL)
npm run build    # production build to dist/
```

Set `VITE_API_BASE_URL` (default `http://localhost:5000/api`). Use the quick
demo-login buttons on the Login page after running `npm run seed` in the backend.
