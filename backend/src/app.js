/**
 * Express application assembly.
 * Wires security middleware, request logging, the API router, and the
 * centralized error handling pipeline.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import env from './config/env.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorConverter, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust the first proxy (needed for correct req.ip behind load balancers).
app.set('trust proxy', 1);

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging -> winston
app.use(
  morgan(env.isProd ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) }
  })
);

// Liveness probe (also available at /api/health)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    data: { demoMode: env.demoMode, timestamp: new Date().toISOString() }
  });
});

// Global API rate limit + mounted routes
app.use(env.apiPrefix, apiLimiter, routes);

// 404 + error handling (order matters: convert before final handler)
app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

export default app;
