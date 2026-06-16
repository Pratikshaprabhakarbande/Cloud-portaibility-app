# frontend/src

> Implementation begins in **Phase 4 (Frontend)**. This phase only establishes
> the directory structure.

```
src/
├── main.jsx        # React entry (Phase 4)
├── App.jsx         # Router shell (Phase 4)
├── assets/         # images, global styles
├── components/     # reusable UI: layout, cards, charts, tables, forms
├── pages/          # Login, Register, Profile, Settings, Showcase
├── modules/        # feature modules mapped to the 19 platform modules
├── context/        # AuthContext / session state
├── hooks/          # custom React hooks (useAuth, useApi, useFetch)
├── routes/         # route config + ProtectedRoute (JWT + role gating)
└── services/       # axios API client + per-module API wrappers
```
