/**
 * Integration tests for the authentication endpoints.
 * In-memory MongoDB + supertest against the real Express app. Modules are
 * imported dynamically after env + DB are ready.
 */

// Required env (JWT secrets are now mandatory) before any src import.
process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = 'test_access_secret_for_jest_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_jest_only';

let mongo;
let mongoose;
let request;
let app;

const VALID = { name: 'Test User', email: 'user@test.io', password: 'Passw0rd!' };

beforeAll(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongoose = (await import('mongoose')).default;
  request = (await import('supertest')).default;

  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGO_URI);

  app = (await import('../../src/app.js')).default;
}, 60000);

afterAll(async () => {
  if (mongoose) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('POST /api/auth/register', () => {
  it('registers a user and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('user@test.io');
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
    // Password must never be serialized.
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('forces a non-admin role on public registration (privilege-escalation guard)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Esc', email: 'esc@test.io', password: 'Passw0rd!', role: 'Admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).not.toBe('Admin');
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID);
    expect(res.status).toBe(409);
  });

  it('rejects a weak password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@test.io', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
  });

  it('rejects invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: 'WrongPass9!' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('rotates a valid refresh token into a new token pair', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    const { refreshToken } = login.body.data.tokens;

    const res = await request(app).post('/api/auth/refresh-token').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeTruthy();

    // The used refresh token is revoked (rotation) -> reuse fails.
    const reuse = await request(app).post('/api/auth/refresh-token').send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('logs out an authenticated user', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    const { accessToken, refreshToken } = login.body.data.tokens;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(200);
  });

  it('rejects logout without a token (401)', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/profile', () => {
  it('returns the profile for a valid access token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    const { accessToken } = login.body.data.tokens;

    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(VALID.email);
  });
});
