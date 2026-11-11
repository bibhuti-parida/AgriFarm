import { z } from 'zod';
import { uuidParam, paginationQuerySchema } from '../../middleware/validate.middleware.js';

export const farmIdParamSchema = {
  params: uuidParam('farmId'),
};

export const fieldIdParamSchema = {
  params: uuidParam('id'),
};

export const createFieldSchema = {
  params: uuidParam('farmId'),
  body: z.strictObject({
    name: z.string().trim().min(1, 'Field name is required').max(120),
    area: z.coerce.number().positive('Field area must be greater than zero'),
    areaUnit: z.string().trim().default('acre'),
    soilType: z.string().trim().max(100).optional(),
    irrigationType: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(1000).optional(),
    status: z.enum(['active', 'inactive']).default('active'),
  }),
};

export const updateFieldSchema = {
  params: uuidParam('id'),
  body: z
    .strictObject({
      name: z.string().trim().min(1).max(120).optional(),
      area: z.coerce.number().positive().optional(),
      areaUnit: z.string().trim().optional(),
      soilType: z.string().trim().max(100).nullable().optional(),
      irrigationType: z.string().trim().max(100).nullable().optional(),
      notes: z.string().trim().max(1000).nullable().optional(),
      status: z.enum(['active', 'inactive']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update'),
};

