import { z } from 'zod';
import { uuidParam, paginationQuerySchema } from '../../middleware/validate.middleware.js';

export const expenseIdParamSchema = {
  params: uuidParam('id'),
};

export const listExpensesQuerySchema = {
  query: paginationQuerySchema.extend({
    farmId: z.string().uuid().optional(),
    fieldId: z.string().uuid().optional(),
    cropCycleId: z.string().uuid().optional(),
    category: z
      .enum([
        'seeds',
        'fertilizer',
        'pesticide',
        'labour',
        'irrigation',
        'equipment',
        'transportation',
        'maintenance',
        'other',
      ])
      .optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
};

export const createExpenseSchema = {
  body: z.strictObject({
    farmId: z.string().uuid('Valid farmId is required'),
    fieldId: z.string().uuid().nullable().optional(),
    cropCycleId: z.string().uuid().nullable().optional(),
    category: z
      .enum([
        'seeds',
        'fertilizer',
        'pesticide',
        'labour',
        'irrigation',
        'equipment',
        'transportation',
        'maintenance',
        'other',
      ])
      .default('other'),
    description: z.string().trim().min(2, 'Description is required').max(255),
    amount: z.coerce.number().positive('Expense amount must be greater than zero'),
    currency: z.string().trim().length(3).default('INR'),
    expenseDate: z.coerce.date().default(() => new Date()),
    vendor: z.string().trim().max(160).optional(),
    receiptUrl: z.string().trim().url('Invalid URL format').max(1000).optional(),
  }),
};

export const updateExpenseSchema = {
  params: uuidParam('id'),
  body: z
    .strictObject({
      fieldId: z.string().uuid().nullable().optional(),
      cropCycleId: z.string().uuid().nullable().optional(),
      category: z
        .enum([
          'seeds',
          'fertilizer',
          'pesticide',
          'labour',
          'irrigation',
          'equipment',
          'transportation',
          'maintenance',
          'other',
        ])
        .optional(),
      description: z.string().trim().min(2).max(255).optional(),
      amount: z.coerce.number().positive().optional(),
      currency: z.string().trim().length(3).optional(),
      expenseDate: z.coerce.date().optional(),
      vendor: z.string().trim().max(160).nullable().optional(),
      receiptUrl: z.string().trim().url().max(1000).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update'),
};

