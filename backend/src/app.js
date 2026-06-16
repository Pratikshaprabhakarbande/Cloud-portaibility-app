/**
 * Express application assembly.
 *
 * Phase 2 (scaffolding): wires only the baseline security middleware and a
 * health endpoint. Feature routes, auth/RBAC, validation, and the cloud
 * adapter layer are added in later phases.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Health check (used by Docker HEALTHCHECK and load balancers)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cloud-portability-backend',
    demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
    timestamp: new Date().toISOString()
  });
});

// TODO (Phase 5+): mount feature routers here, e.g.
//   app.use(`${API_PREFIX}/auth`, authRoutes);
//   app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
//   ...followed by the centralized error handler.

export default app;
