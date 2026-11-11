import { z } from 'zod';
import { paginationQuerySchema } from '../../middleware/validate.middleware.js';

export const listMarketPricesQuerySchema = {
  query: paginationQuerySchema.extend({
    cropId: z.string().uuid().optional(),
    cropName: z.string().trim().optional(),
    marketName: z.string().trim().optional(),
    district: z.string().trim().optional(),
    state: z.string().trim().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
};

export const latestPricesQuerySchema = {
  query: z.object({
    cropName: z.string().trim().optional(),
    state: z.string().trim().optional(),
    district: z.string().trim().optional(),
  }),
};

