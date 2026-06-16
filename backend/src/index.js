/**
 * Process entry point.
 *
 * Phase 2 (scaffolding): boots a minimal Express server exposing a health check
 * so the container/compose topology is verifiable. Full application wiring
 * (DB connection, routes, adapters) is added in Phase 5 (Backend) and Phase 6
 * (MongoDB Integration).
 */
import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[backend] listening on port ${PORT} (DEMO_MODE=${process.env.DEMO_MODE ?? 'true'})`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`[backend] received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
