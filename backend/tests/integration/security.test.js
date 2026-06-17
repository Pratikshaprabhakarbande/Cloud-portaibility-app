/**
 * Integration tests for the Security Center endpoints.
 */
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = 'test_access_secret_for_jest_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_jest_only';

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
  const { User, AuditLog } = await import('../../src/models/index.js');
  const { signAccessToken } = await import('../../src/utils/jwt.js');
  const { ROLES, AUDIT_ACTIONS } = await import('../../src/config/constants.js');

  const make = async (role, email) => {
    const u = await User.create({ name: role, email, password: 'Passw0rd!', role });
    tokens[role] = signAccessToken(u);
  };
  await make(ROLES.VIEWER, 'sv@test.io');
  await make(ROLES.CLOUD_ENGINEER, 'sc@test.io');
  await make(ROLES.ADMIN, 'sa@test.io');

  // Seed some failed logins for risk/failed-login tracking.
  await AuditLog.create([
    { action: AUDIT_ACTIONS.LOGIN, success: false, actorEmail: 'attacker@evil.io', ip: '10.0.0.1' },
    { action: AUDIT_ACTIONS.LOGIN, success: false, actorEmail: 'attacker@evil.io', ip: '10.0.0.1' },
    { action: AUDIT_ACTIONS.LOGIN, success: true, actorEmail: 'sc@test.io', ip: '10.0.0.2' }
  ]);
}, 60000);

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const auth = (role) => ({ Authorization: `Bearer ${tokens[role]}` });

describe('Security Center', () => {
  it('rejects unauthenticated access (401)', async () => {
    const res = await request(app).get('/api/security/overview');
    expect(res.status).toBe(401);
  });

  it('returns a risk score to any authenticated role', async () => {
    const res = await request(app).get('/api/security/risk-score').set(auth('Viewer'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('riskScore');
    expect(res.body.data.riskScore).toBeGreaterThanOrEqual(0);
    expect(res.body.data.riskScore).toBeLessThanOrEqual(100);
    expect(res.body.data.inputs.failedLogins24h).toBeGreaterThanOrEqual(2);
  });

  it('forbids a Viewer from raw access logs (403)', async () => {
    const res = await request(app).get('/api/security/access-logs').set(auth('Viewer'));
    expect(res.status).toBe(403);
  });

  it('lets a Cloud Engineer read access logs', async () => {
    const res = await request(app).get('/api/security/access-logs?limit=10').set(auth('Cloud Engineer'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it('tracks failed logins (Admin)', async () => {
    const res = await request(app).get('/api/security/failed-logins?hours=24').set(auth('Admin'));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.bySource.length).toBeGreaterThanOrEqual(1);
  });

  it('validates query params (400 on bad action filter)', async () => {
    const res = await request(app).get('/api/security/access-logs?action=bogus').set(auth('Admin'));
    expect(res.status).toBe(400);
  });
});
