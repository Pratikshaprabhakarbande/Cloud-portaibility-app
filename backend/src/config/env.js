/**
 * Centralized, validated environment configuration.
 *
 * Reads from process.env (populated by dotenv in index.js) and exposes a typed,
 * frozen config object. Fails fast in production if required secrets are missing.
 */
import 'dotenv/config';

const toBool = (v, fallback = false) =>
  v === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: toInt(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  demoMode: toBool(process.env.DEMO_MODE, true),

  db: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/cloudportability',
    // Mongoose connection options
    options: {
      serverSelectionTimeoutMS: toInt(process.env.MONGO_TIMEOUT_MS, 10000),
      maxPoolSize: toInt(process.env.MONGO_POOL_SIZE, 10),
      autoIndex: (process.env.NODE_ENV || 'development') !== 'production'
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_insecure_secret_change_me',
    // Access token should be short-lived; refresh token longer-lived & revocable.
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_SECRET ||
      'dev_insecure_refresh_secret_change_me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    // Password reset token lifetime (minutes)
    resetExpiresInMin: toInt(process.env.JWT_RESET_EXPIRES_MIN, 15)
  },

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100)
  },

  logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Validate critical configuration. In production we refuse to start with
 * insecure defaults; in development we only warn so the demo still runs.
 */
export function validateEnv() {
  const problems = [];
  if (env.isProd) {
    if (!process.env.JWT_SECRET || env.jwt.secret === 'dev_insecure_secret_change_me') {
      problems.push('JWT_SECRET must be set to a strong value in production');
    }
    if (
      !process.env.JWT_REFRESH_SECRET ||
      env.jwt.refreshSecret === 'dev_insecure_refresh_secret_change_me'
    ) {
      problems.push('JWT_REFRESH_SECRET must be set to a strong value in production');
    }
    if (!process.env.MONGO_URI) {
      problems.push('MONGO_URI must be set in production');
    }
  }
  if (problems.length) {
    const msg = `Invalid environment configuration:\n - ${problems.join('\n - ')}`;
    if (env.isProd) throw new Error(msg);
    console.warn(`[env] ${msg}`);
  }
  return env;
}

export default Object.freeze(env);
