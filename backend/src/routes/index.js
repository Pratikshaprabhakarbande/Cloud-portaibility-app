/**
 * Root API router. Mounts feature routers under the API prefix.
 * Additional module routers (dashboard, security, finops, ...) are added in
 * later phases.
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    data: {
      service: 'cloud-portability-backend',
      demoMode: (process.env.DEMO_MODE ?? 'true') === 'true',
      timestamp: new Date().toISOString()
    }
  });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
