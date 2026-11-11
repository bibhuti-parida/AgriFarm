import { z } from 'zod';
import { uuidParam, paginationQuerySchema } from '../../middleware/validate.middleware.js';

export const farmIdParamSchema = {
  params: uuidParam('id'),
};

export const listFarmsQuerySchema = {
  query: paginationQuerySchema.extend({
    status: z.enum(['active', 'inactive', 'archived']).optional(),
  }),
};

export const createFarmSchema = {
  body: z.strictObject({
    name: z.string().trim().min(2, 'Farm name must be at least 2 characters').max(150),
    description: z.string().trim().max(1000).optional(),
    address: z.string().trim().max(500).optional(),
    village: z.string().trim().max(120).optional(),
    district: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    country: z.string().trim().max(120).default('India'),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    totalArea: z.coerce.number().positive('Total area must be greater than zero'),
    areaUnit: z.string().trim().default('acre'),
    status: z.enum(['active', 'inactive', 'archived']).default('active'),
  }),
};

export const updateFarmSchema = {
  params: uuidParam('id'),
  body: z
    .strictObject({
      name: z.string().trim().min(2).max(150).optional(),
      description: z.string().trim().max(1000).nullable().optional(),
      address: z.string().trim().max(500).nullable().optional(),
      village: z.string().trim().max(120).nullable().optional(),
      district: z.string().trim().max(120).nullable().optional(),
      state: z.string().trim().max(120).nullable().optional(),
      country: z.string().trim().max(120).optional(),
      latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
      longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
      totalArea: z.coerce.number().positive().optional(),
      areaUnit: z.string().trim().optional(),
      status: z.enum(['active', 'inactive', 'archived']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update'),
};

