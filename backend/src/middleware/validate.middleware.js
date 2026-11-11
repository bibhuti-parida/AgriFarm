import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const uuidParam = (paramName = 'id') =>
  z.object({
    [paramName]: z.string().uuid(`Invalid ${paramName}: must be a valid UUID`),
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
});

/**
 * Validates request data against Zod schemas for body, query, and params.
 * Populates req.validated and replaces req.body with the parsed result.
 */
export const validate = (schemas) => (req, _res, next) => {
  const details = [];
  req.validated = req.validated || {};

  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key] ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        details.push({
          in: key,
          path: issue.path.join('.'),
          message: issue.message,
        });
      }
    } else {
      req.validated[key] = result.data;
      if (key === 'body') {
        req.body = result.data;
      }
    }
  }

  if (details.length > 0) {
    return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
  }

  next();
};

