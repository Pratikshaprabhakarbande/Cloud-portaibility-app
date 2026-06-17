/**
 * Integration tests for the Terraform automation endpoints.
 * Runs in SIMULATION mode (TERRAFORM_ENABLED unset/false) — no binary, no cloud.
 */
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = 'test_access_secret_for_jest_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_jest_only';
// Ensure simulation mode regardless of the host environment.
process.env.TERRAFORM_ENABLED = 'false';

let mongo;
let mongoose;
let request;
let app;
const tokens = {};

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
  const { ROLES } = await import('../../src/config/constants.js');

  const make = async (role, email) => {
    const u = await User.create({ name: role, email, password: 'Passw0rd!', role });
    tokens[role] = signAccessToken(u);
  };
  await make(ROLES.VIEWER, 'v@test.io');
  await make(ROLES.DEVOPS_ENGINEER, 'd@test.io');
  await make(ROLES.CLOUD_ENGINEER, 'c@test.io');
  await make(ROLES.ADMIN, 'a@test.io');
}, 60000);

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const auth = (role) => ({ Authorization: `Bearer ${tokens[role]}` });

describe('Terraform RBAC + simulation', () => {
  it('rejects unauthenticated requests (401)', async () => {
    const res = await request(app).post('/api/terraform/plan').send({ provider: 'aws' });
    expect(res.status).toBe(401);
  });

  it('lets a DevOps Engineer run plan (simulated)', async () => {
    const res = await request(app)
      .post('/api/terraform/plan')
      .set(auth('DevOps Engineer'))
      .send({ provider: 'aws' });
    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe('simulated');
    expect(res.body.data.status).toBe('success');
    expect(res.body.data.logs).toMatch(/Plan:/);
  });

  it('forbids a Viewer from running plan (403)', async () => {
    const res = await request(app)
      .post('/api/terraform/plan')
      .set(auth('Viewer'))
      .send({ provider: 'aws' });
    expect(res.status).toBe(403);
  });

  it('forbids a DevOps Engineer from apply (mutation needs Cloud Engineer+)', async () => {
    const res = await request(app)
      .post('/api/terraform/apply')
      .set(auth('DevOps Engineer'))
      .send({ provider: 'aws' });
    expect(res.status).toBe(403);
  });

  it('lets a Cloud Engineer apply (simulated, 0 resources)', async () => {
    const res = await request(app)
      .post('/api/terraform/apply')
      .set(auth('Cloud Engineer'))
      .send({ provider: 'azure' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('success');
  });

  it('lets an Admin destroy (simulated)', async () => {
    const res = await request(app)
      .post('/api/terraform/destroy')
      .set(auth('Admin'))
      .send({ provider: 'gcp' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('destroyed');
  });

  it('rejects an invalid provider (400)', async () => {
    const res = await request(app)
      .post('/api/terraform/plan')
      .set(auth('Admin'))
      .send({ provider: 'oracle' });
    expect(res.status).toBe(400);
  });

  it('records terraform actions in history', async () => {
    const res = await request(app).get('/api/terraform/history').set(auth('Viewer'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.results)).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThan(0);
    expect(res.body.data.results[0]).toHaveProperty('action');
  });
});
