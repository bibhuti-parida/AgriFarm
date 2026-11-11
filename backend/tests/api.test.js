import './setup-env.js';
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import {
  passwordFingerprint,
  signToken,
  signPasswordResetToken,
} from '../src/modules/auth/auth.service.js';

test('API: GET /api/v1/health returns ok status and standard envelope', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'ok');
  assert.ok(res.body.data.timestamp);
});

test('API: 404 handler returns standardized error envelope for unknown routes', async () => {
  const res = await request(app).get('/api/v1/unknown-endpoint');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
});

test('API: Private endpoints reject unauthenticated requests with 401', async () => {
  const endpoints = [
    ['get', '/api/v1/auth/me'],
    ['get', '/api/v1/farms'],
    ['post', '/api/v1/farms'],
    ['get', '/api/v1/crop-cycles'],
    ['get', '/api/v1/tasks'],
    ['get', '/api/v1/expenses'],
    ['get', '/api/v1/dashboard/summary'],
    ['get', '/api/v1/reports/production'],
  ];

  for (const [method, path] of endpoints) {
    const res = await request(app)[method](path);
    assert.equal(res.status, 401, `Expected 401 for unauthenticated ${method.toUpperCase()} ${path}`);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  }
});

test('API: Malformed Bearer token is rejected with 401', async () => {
  const res = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', 'Bearer invalid_garbage_token_value');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'INVALID_TOKEN');
});

test('API: Expired JWT is rejected with TOKEN_EXPIRED error code', async () => {
  const expiredToken = jwt.sign(
    { sub: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', pwf: 'test' },
    process.env.JWT_SECRET,
    { expiresIn: -10 }
  );

  const res = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${expiredToken}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'TOKEN_EXPIRED');
});

test('Auth Service: signToken and passwordFingerprint generate verifiable tokens', () => {
  const mockUser = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'farmer@agrifarm.dev',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
  };

  const token = signToken(mockUser);
  assert.ok(token);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(decoded.sub, mockUser.id);
  assert.equal(decoded.email, mockUser.email);
  assert.equal(decoded.pwf, passwordFingerprint(mockUser.passwordHash));
});

test('Auth Service: signPasswordResetToken creates single-use password_reset token', () => {
  const mockUser = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'farmer@agrifarm.dev',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
  };

  const resetToken = signPasswordResetToken(mockUser);
  assert.ok(resetToken);

  const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  assert.equal(decoded.sub, mockUser.id);
  assert.equal(decoded.email, mockUser.email);
  assert.equal(decoded.purpose, 'password_reset');
  assert.equal(decoded.pwf, passwordFingerprint(mockUser.passwordHash));
});

test('API: POST /api/v1/auth/forgot-password validates email and returns standard envelope', async () => {
  const bad = await request(app)
    .post('/api/v1/auth/forgot-password')
    .send({ email: 'not-valid' });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 'VALIDATION_ERROR');

  // Stub prisma.user.findUnique to simulate non-existing user
  const originalFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async () => null;

  try {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@agrifarm.dev' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.message.includes('If an account with this email exists'));
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
});

test('API: POST /api/v1/auth/forgot-password returns resetToken when user exists in non-prod', async () => {
  const mockUser = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'farmer@agrifarm.dev',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
    status: 'active',
  };

  const originalFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async () => mockUser;

  try {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'farmer@agrifarm.dev' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.resetToken);

    // Verify the returned token is a valid password_reset JWT
    const decoded = jwt.verify(res.body.data.resetToken, process.env.JWT_SECRET);
    assert.equal(decoded.sub, mockUser.id);
    assert.equal(decoded.purpose, 'password_reset');
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
});

test('API: POST /api/v1/auth/reset-password rejects invalid or forged tokens', async () => {
  const forgedToken = jwt.sign(
    { sub: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', pwf: 'fake', purpose: 'login' },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .post('/api/v1/auth/reset-password')
    .send({ token: forgedToken, newPassword: 'NewSecurePassword123' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_TOKEN');
});


