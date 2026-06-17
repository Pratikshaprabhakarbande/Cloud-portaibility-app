/**
 * Integration tests for the AI Cloud Advisor (rule-based engine, offline).
 */
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.AI_PROVIDER = 'rule';
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
  const { User } = await import('../../src/models/index.js');
  const { signAccessToken } = await import('../../src/utils/jwt.js');
  const { ROLES } = await import('../../src/config/constants.js');

  const make = async (role, email) => {
    const u = await User.create({ name: role, email, password: 'Passw0rd!', role });
    tokens[role] = signAccessToken(u);
  };
  await make(ROLES.VIEWER, 'av@test.io');
  await make(ROLES.DEVOPS_ENGINEER, 'ad@test.io');
}, 60000);

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const auth = (role) => ({ Authorization: `Bearer ${tokens[role]}` });

describe('AI Cloud Advisor', () => {
  it('rejects unauthenticated requests (401)', async () => {
    const res = await request(app).post('/api/ai/advisor').send({});
    expect(res.status).toBe(401);
  });

  it('forbids a Viewer from generating advice (403)', async () => {
    const res = await request(app).post('/api/ai/advisor').set(auth('Viewer')).send({ provider: 'aws' });
    expect(res.status).toBe(403);
  });

  it('generates rule-based recommendations for a DevOps Engineer', async () => {
    const res = await request(app)
      .post('/api/ai/advisor')
      .set(auth('DevOps Engineer'))
      .send({ provider: 'multi-cloud' });
    expect(res.status).toBe(201);
    expect(res.body.data.engine.engine).toBe('rule-based');
    expect(Array.isArray(res.body.data.recommendations)).toBe(true);
    expect(Array.isArray(res.body.data.securityRecommendations)).toBe(true);
    expect(typeof res.body.data.summary).toBe('string');
  });

  it('lists recommendation history', async () => {
    const res = await request(app).get('/api/ai/recommendations').set(auth('Viewer'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.results)).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThan(0);
  });

  it('rejects an invalid recommendation type (400)', async () => {
    const res = await request(app)
      .post('/api/ai/advisor')
      .set(auth('DevOps Engineer'))
      .send({ provider: 'aws', type: 'bogus' });
    expect(res.status).toBe(400);
  });
});
