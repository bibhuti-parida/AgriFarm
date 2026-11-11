import { z } from 'zod';
import { uuidParam, paginationQuerySchema } from '../../middleware/validate.middleware.js';

export const harvestIdParamSchema = {
  params: uuidParam('id'),
};

export const cropCycleIdParamSchema = {
  params: uuidParam('cropCycleId'),
};

export const createHarvestSchema = {
  params: uuidParam('cropCycleId'),
  body: z.strictObject({
    harvestedOn: z.coerce.date().default(() => new Date()),
    quantity: z.coerce.number().positive('Quantity harvested must be positive'),
    quantityUnit: z.string().trim().min(1, 'Quantity unit is required').max(30),
    grade: z.string().trim().max(50).optional(),
    sellingPricePerUnit: z.coerce.number().positive().optional(),
    currency: z.string().trim().length(3).default('INR'),
    buyer: z.string().trim().max(160).optional(),
    notes: z.string().trim().max(1000).optional(),
    markCycleHarvested: z.boolean().default(false),
  }),
};

export const updateHarvestSchema = {
  params: uuidParam('id'),
  body: z
    .strictObject({
      harvestedOn: z.coerce.date().optional(),
      quantity: z.coerce.number().positive().optional(),
      quantityUnit: z.string().trim().max(30).optional(),
      grade: z.string().trim().max(50).nullable().optional(),
      sellingPricePerUnit: z.coerce.number().positive().nullable().optional(),
      currency: z.string().trim().length(3).optional(),
      buyer: z.string().trim().max(160).nullable().optional(),
      notes: z.string().trim().max(1000).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update'),
};

export const listHarvestsQuerySchema = {
  query: paginationQuerySchema.extend({
    farmId: z.string().uuid().optional(),
    fieldId: z.string().uuid().optional(),
    cropCycleId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
};

