/**
 * Integration tests for the Compliance, FinOps, and Migration modules.
 */
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

  app = (await import('../../src/app.js')).default;
  const { User } = await import('../../src/models/index.js');
  const { signAccessToken } = await import('../../src/utils/jwt.js');

  const user = await User.create({ name: 'Mod Tester', email: 'mod@test.io', password: 'Passw0rd!', role: 'Cloud Engineer' });
  token = signAccessToken(user);
}, 60000);

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('Compliance Checker', () => {
  it('lists frameworks', async () => {
    const res = await request(app).get('/api/compliance/frameworks').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toContain('CIS');
  });

  it('runs a compliance scan and scores it', async () => {
    const res = await request(app).post('/api/compliance/scan').set(auth()).send({ provider: 'aws', framework: 'CIS' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('complianceScore');
    expect(Array.isArray(res.body.data.controls)).toBe(true);
    expect(res.body.data.summary.total).toBeGreaterThan(0);
  });

  it('rejects an invalid provider (400)', async () => {
    const res = await request(app).post('/api/compliance/scan').set(auth()).send({ provider: 'oracle' });
    expect(res.status).toBe(400);
  });

  it('returns report history', async () => {
    const res = await request(app).get('/api/compliance/reports').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBeGreaterThan(0);
  });

  it('rejects unauthenticated access (401)', async () => {
    const res = await request(app).get('/api/compliance/frameworks');
    expect(res.status).toBe(401);
  });
});

describe('FinOps Optimizer', () => {
  it('returns a cost summary for a scope', async () => {
    const res = await request(app).get('/api/finops/summary?provider=multi-cloud').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.totals).toHaveProperty('monthlyCost');
  });

  it('returns recommendations with utilization', async () => {
    const res = await request(app).get('/api/finops/recommendations?provider=aws').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.recommendations)).toBe(true);
    expect(res.body.data.utilization).toHaveProperty('runningRatio');
  });

  it('analyzes a provider and persists a report', async () => {
    const res = await request(app).post('/api/finops/analyze').set(auth()).send({ provider: 'aws' });
    expect(res.status).toBe(201);
    expect(res.body.data.totalPotentialSavings).toBeGreaterThanOrEqual(0);

    const history = await request(app).get('/api/finops/reports').set(auth());
    expect(history.status).toBe(200);
    expect(history.body.data.results.length).toBeGreaterThan(0);
  });
});

describe('Migration Advisor', () => {
  it('compares two providers', async () => {
    const res = await request(app).get('/api/migration/compare?source=aws&target=azure').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.serviceMappings.length).toBeGreaterThan(0);
  });

  it('generates and persists a migration plan', async () => {
    const res = await request(app)
      .post('/api/migration/plan')
      .set(auth())
      .send({ sourceProvider: 'aws', targetProvider: 'azure', workloadName: 'payments-api' });
    expect(res.status).toBe(201);
    expect(res.body.data.plan.length).toBe(4);
    expect(['info', 'low', 'medium', 'high', 'critical']).toContain(res.body.data.riskLevel);

    const history = await request(app).get('/api/migration/reports').set(auth());
    expect(history.status).toBe(200);
    expect(history.body.data.results.length).toBeGreaterThan(0);
  });

  it('rejects same source and target (400)', async () => {
    const res = await request(app)
      .post('/api/migration/plan')
      .set(auth())
      .send({ sourceProvider: 'aws', targetProvider: 'aws' });
    expect(res.status).toBe(400);
  });
});
