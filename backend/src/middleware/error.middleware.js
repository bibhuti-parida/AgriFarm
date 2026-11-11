import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { isProd, isTest } from '../config/env.js';

export const mapPrismaError = (err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return new ApiError(409, 'UNIQUE_CONSTRAINT', 'A record with these values already exists', {
          fields: err.meta?.target,
        });
      case 'P2003':
        return new ApiError(
          409,
          'FOREIGN_KEY_CONSTRAINT',
          'Operation violates a relationship constraint (referenced record missing or record is in use)'
        );
      case 'P2025':
        return new ApiError(404, 'NOT_FOUND', 'Record not found');
      case 'P2023':
        return new ApiError(400, 'INVALID_ID', 'Malformed identifier (expected a UUID)');
      case 'P2000':
        return new ApiError(400, 'VALUE_TOO_LONG', 'A supplied value exceeds maximum allowed length');
      default:
        return null;
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return new ApiError(400, 'VALIDATION_ERROR', 'Invalid data supplied for database query');
  }
  return null;
};

export const errorHandler = (err, _req, res, _next) => {
  let apiErr = null;

  if (err instanceof ApiError) {
    apiErr = err;
  } else if (err instanceof ZodError) {
    apiErr = ApiError.badRequest(
      'Validation failed',
      'VALIDATION_ERROR',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    );
  } else if (err instanceof jwt.TokenExpiredError) {
    apiErr = ApiError.unauthorized('Token has expired', 'TOKEN_EXPIRED');
  } else if (err instanceof jwt.JsonWebTokenError) {
    apiErr = ApiError.unauthorized('Invalid authentication token', 'INVALID_TOKEN');
  } else if (err?.type === 'entity.parse.failed') {
    apiErr = ApiError.badRequest('Malformed JSON body', 'INVALID_JSON');
  } else if (err?.type === 'entity.too.large') {
    apiErr = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body payload too large');
  } else {
    apiErr = mapPrismaError(err);
  }

  if (!apiErr) {
    if (!isTest) {
      console.error(err);
    }
    apiErr = new ApiError(
      500,
      'INTERNAL_ERROR',
      isProd ? 'Something went wrong' : err?.message || 'Something went wrong'
    );
  }

  const errorResponse = {
    code: apiErr.code,
  };
  if (apiErr.details) {
    errorResponse.details = apiErr.details;
  }

  res.status(apiErr.statusCode).json({
    success: false,
    message: apiErr.message,
    error: errorResponse,
  });
};

