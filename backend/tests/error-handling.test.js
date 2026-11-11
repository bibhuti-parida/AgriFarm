import './setup-env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { mapPrismaError } from '../src/middleware/error.middleware.js';
import { ApiError } from '../src/utils/ApiError.js';
import { sendSuccess } from '../src/utils/ApiResponse.js';

test('Error Mapping: Prisma error codes map to correct HTTP statuses', () => {
  const p2002 = new Prisma.PrismaClientKnownRequestError('Unique error', {
    code: 'P2002',
    clientVersion: '6.4.1',
    meta: { target: ['email'] },
  });
  const err2002 = mapPrismaError(p2002);
  assert.equal(err2002.statusCode, 409);
  assert.equal(err2002.code, 'UNIQUE_CONSTRAINT');

  const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
    code: 'P2025',
    clientVersion: '6.4.1',
  });
  const err2025 = mapPrismaError(p2025);
  assert.equal(err2025.statusCode, 404);
  assert.equal(err2025.code, 'NOT_FOUND');

  const p2023 = new Prisma.PrismaClientKnownRequestError('Bad UUID', {
    code: 'P2023',
    clientVersion: '6.4.1',
  });
  const err2023 = mapPrismaError(p2023);
  assert.equal(err2023.statusCode, 400);
  assert.equal(err2023.code, 'INVALID_ID');

  const generic = new Error('Generic unhandled');
  assert.equal(mapPrismaError(generic), null);
});

test('API Response: sendSuccess produces the expected standard envelope', () => {
  let capturedStatus = null;
  let capturedBody = null;

  const mockRes = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    json(body) {
      capturedBody = body;
      return this;
    },
  };

  sendSuccess(mockRes, {
    statusCode: 201,
    message: 'Farm created successfully',
    data: { farm: { id: '123' } },
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  });

  assert.equal(capturedStatus, 201);
  assert.equal(capturedBody.success, true);
  assert.equal(capturedBody.message, 'Farm created successfully');
  assert.equal(capturedBody.data.farm.id, '123');
  assert.equal(capturedBody.meta.total, 1);
});

