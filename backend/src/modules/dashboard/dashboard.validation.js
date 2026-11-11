import { z } from 'zod';

export const dashboardFilterSchema = {
  query: z.object({
    farmId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
};

