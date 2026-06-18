/**
 * Integration tests for the Module 2 dashboard endpoints.
 *
 * Spins up an in-memory MongoDB, seeds minimal data, and exercises the routes
 * through the real Express app via supertest. Modules are imported dynamically
 * AFTER env + DB are ready, so config picks up the test values.
 */

// Set required env before any src module is (dynamically) imported.
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = 'test_access_secret_for_jest_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_jest_only';

let mongo;
let mongoose;
let request;
let app;
let token;

beforeAll(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongoose = (await import('mongoose')).default;
  request = (await import('supertest')).default;

  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGO_URI);

  // Import app + helpers AFTER db is connected and env is set.
  app = (await import('../../src/app.js')).default;
  const { User, Deployment, CostReport, SecurityReport } = await import('../../src/models/index.js');
  const { signAccessToken } = await import('../../src/utils/jwt.js');

  const user = await User.create({
    name: 'Test Admin',
    email: 'test.admin@demo.io',
    password: 'Admin@12345',
    role: 'Admin'
  });
  token = signAccessToken(user);

  await Deployment.create([
    { name: 'payments-api', provider: 'aws', type: 'terraform', status: 'success', version: 2, user: user._id },
    { name: 'web-frontend', provider: 'aws', type: 'docker', status: 'success', version: 1, user: user._id },
    { name: 'analytics-job', provider: 'gcp', type: 'kubernetes', status: 'failed', version: 1, user: user._id }
  ]);

  await CostReport.create([
    { provider: 'aws', dailyCost: 4, monthlyCost: 120, projectedCost: 130, period: { month: '2026-05' }, user: user._id },
    { provider: 'aws', dailyCost: 5, monthlyCost: 140, projectedCost: 150, period: { month: '2026-06' }, user: user._id },
    { provider: 'azure', dailyCost: 3, monthlyCost: 90, projectedCost: 95, period: { month: '2026-06' }, user: user._id }
  ]);

  await SecurityReport.create({
    provider: 'aws',
    securityScore: 80,
    riskScore: 30,
    user: user._id,
    findings: [{ title: 'Public bucket', category: 'public_bucket', severity: 'high' }]
  });
}, 60000);

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('Dashboard auth', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/dashboard/overview');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/dashboard/overview', () => {
  it('returns provider cards, summary, and recent deployments', async () => {
    const res = await request(app).get('/api/dashboard/overview').set(auth());
    expect(res.status).toBe(200);
    const { providers, summary, recentDeployments } = res.body.data;
    expect(providers).toHaveLength(3); // aws, azure, gcp
    expect(summary).toHaveProperty('cloudHealthScore');
    expect(summary.activeDeployments).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(recentDeployments)).toBe(true);
  });
});

describe('GET /api/dashboard/health-score', () => {
  it('returns an overall score and per-provider breakdown', async () => {
    const res = await request(app).get('/api/dashboard/health-score').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.overall).toBeGreaterThanOrEqual(0);
    expect(res.body.data.providers).toHaveLength(3);
  });
});

describe('GET /api/dashboard/deployments/stats', () => {
  it('computes totals and success rate', async () => {
    const res = await request(app).get('/api/dashboard/deployments/stats').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    // 2 success of (2 success + 1 failed) terminal = ~67
    expect(res.body.data.successRate).toBe(67);
  });
});

describe('GET /api/dashboard/cost-summary', () => {
  it('aggregates totals and month-over-month change', async () => {
    const res = await request(app).get('/api/dashboard/cost-summary').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.totals.monthlyCost).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.trends)).toBe(true);
  });
});

describe('GET /api/dashboard/deployments (history)', () => {
  it('supports pagination and search', async () => {
    const res = await request(app)
      .get('/api/dashboard/deployments?limit=2&page=1&search=payments')
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('results');
    expect(res.body.data.limit).toBe(2);
  });

  it('rejects an invalid provider filter with 400', async () => {
    const res = await request(app).get('/api/dashboard/deployments?provider=oracle').set(auth());
    expect(res.status).toBe(400);
  });
});

describe('Provider switching (Cloud Adapter Layer)', () => {
  it('scopes the overview to a single provider via ?provider=aws', async () => {
    const res = await request(app).get('/api/dashboard/overview?provider=aws').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.providers).toHaveLength(1);
    expect(res.body.data.providers[0].key).toBe('aws');
  });

  it('aggregates all providers for multi-cloud (default)', async () => {
    const res = await request(app).get('/api/dashboard/overview?provider=multi-cloud').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.providers).toHaveLength(3);
  });

  it('serves synthetic data via the mock provider', async () => {
    const res = await request(app).get('/api/dashboard/health-score?provider=mock').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.providers).toHaveLength(1);
    expect(res.body.data.providers[0].key).toBe('mock');
  });

  it('rejects an invalid provider scope with 400', async () => {
    const res = await request(app).get('/api/dashboard/overview?provider=oracle').set(auth());
    expect(res.status).toBe(400);
  });
});
