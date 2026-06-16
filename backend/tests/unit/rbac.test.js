/**
 * Unit tests for RBAC authorization middleware (no DB / HTTP needed).
 */
process.env.NODE_ENV = 'test';

import { authorize, authorizeMin } from '../../src/middleware/rbac.js';
import { ROLES } from '../../src/config/constants.js';

const mockReqRes = (role) => {
  const req = role ? { user: { role } } : {};
  const res = {};
  const calls = [];
  const next = (err) => calls.push(err);
  return { req, res, next, calls };
};

describe('authorize(...roles)', () => {
  it('allows a user whose role is in the allow-list', () => {
    const { req, res, next, calls } = mockReqRes(ROLES.ADMIN);
    authorize(ROLES.ADMIN, ROLES.CLOUD_ENGINEER)(req, res, next);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeUndefined(); // next() with no error
  });

  it('forbids a user whose role is not allowed (403)', () => {
    const { req, res, next, calls } = mockReqRes(ROLES.VIEWER);
    authorize(ROLES.ADMIN)(req, res, next);
    expect(calls[0]).toBeDefined();
    expect(calls[0].statusCode).toBe(403);
  });

  it('rejects an unauthenticated request (401)', () => {
    const { req, res, next, calls } = mockReqRes(null);
    authorize(ROLES.ADMIN)(req, res, next);
    expect(calls[0]).toBeDefined();
    expect(calls[0].statusCode).toBe(401);
  });
});

describe('authorizeMin(role)', () => {
  it('allows a higher-ranked role', () => {
    const { req, res, next, calls } = mockReqRes(ROLES.ADMIN);
    authorizeMin(ROLES.DEVOPS_ENGINEER)(req, res, next);
    expect(calls[0]).toBeUndefined();
  });

  it('allows the exact minimum role', () => {
    const { req, res, next, calls } = mockReqRes(ROLES.DEVOPS_ENGINEER);
    authorizeMin(ROLES.DEVOPS_ENGINEER)(req, res, next);
    expect(calls[0]).toBeUndefined();
  });

  it('forbids a lower-ranked role (403)', () => {
    const { req, res, next, calls } = mockReqRes(ROLES.VIEWER);
    authorizeMin(ROLES.CLOUD_ENGINEER)(req, res, next);
    expect(calls[0]).toBeDefined();
    expect(calls[0].statusCode).toBe(403);
  });
});
