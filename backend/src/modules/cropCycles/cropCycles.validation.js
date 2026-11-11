import { z } from 'zod';
import { uuidParam, paginationQuerySchema } from '../../middleware/validate.middleware.js';

export const cropCycleIdParamSchema = {
  params: uuidParam('id'),
};

export const listCropCyclesQuerySchema = {
  query: paginationQuerySchema.extend({
    farmId: z.string().uuid().optional(),
    fieldId: z.string().uuid().optional(),
    cropId: z.string().uuid().optional(),
    status: z.enum(['planned', 'active', 'harvested', 'cancelled']).optional(),
    healthStatus: z.enum(['healthy', 'needs_attention', 'affected', 'unknown']).optional(),
    growthStage: z
      .enum([
        'preparation',
        'sowing',
        'germination',
        'vegetative',
        'flowering',
        'fruiting',
        'maturity',
        'harvested',
      ])
      .optional(),
    season: z.string().trim().optional(),
  }),
};

export const createCropCycleSchema = {
  body: z.strictObject({
    fieldId: z.string().uuid('Valid fieldId is required'),
    cropId: z.string().uuid('Valid cropId is required'),
    season: z.string().trim().max(80).optional(),
    plantingDate: z.coerce.date().optional(),
    expectedHarvestDate: z.coerce.date().optional(),
    areaCultivated: z.coerce.number().positive('Area cultivated must be positive'),
    areaUnit: z.string().trim().default('acre'),
    expectedYield: z.coerce.number().positive().optional(),
    yieldUnit: z.string().trim().max(30).optional(),
    expectedSellingPricePerUnit: z.coerce.number().positive().optional(),
    currency: z.string().trim().length(3).default('INR'),
    growthStage: z
      .enum([
        'preparation',
        'sowing',
        'germination',
        'vegetative',
        'flowering',
        'fruiting',
        'maturity',
        'harvested',
      ])
      .default('preparation'),
    healthStatus: z
      .enum(['healthy', 'needs_attention', 'affected', 'unknown'])
      .default('unknown'),
    status: z.enum(['planned', 'active', 'harvested', 'cancelled']).default('planned'),
    notes: z.string().trim().max(1000).optional(),
  }),
};

export const updateCropCycleSchema = {
  params: uuidParam('id'),
  body: z
    .strictObject({
      season: z.string().trim().max(80).optional(),
      plantingDate: z.coerce.date().nullable().optional(),
      expectedHarvestDate: z.coerce.date().nullable().optional(),
      actualHarvestDate: z.coerce.date().nullable().optional(),
      areaCultivated: z.coerce.number().positive().optional(),
      areaUnit: z.string().trim().optional(),
      expectedYield: z.coerce.number().positive().nullable().optional(),
      yieldUnit: z.string().trim().max(30).nullable().optional(),
      expectedSellingPricePerUnit: z.coerce.number().positive().nullable().optional(),
      currency: z.string().trim().length(3).optional(),
      growthStage: z
        .enum([
          'preparation',
          'sowing',
          'germination',
          'vegetative',
          'flowering',
          'fruiting',
          'maturity',
          'harvested',
        ])
        .optional(),
      healthStatus: z
        .enum(['healthy', 'needs_attention', 'affected', 'unknown'])
        .optional(),
      status: z.enum(['planned', 'active', 'harvested', 'cancelled']).optional(),
      notes: z.string().trim().max(1000).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update'),
};

