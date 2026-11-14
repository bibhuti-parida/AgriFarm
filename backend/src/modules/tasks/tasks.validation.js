import { z } from 'zod';
import { uuidParam, paginationQuerySchema } from '../../middleware/validate.middleware.js';

export const taskIdParamSchema = {
  params: uuidParam('id'),
};

export const listTasksQuerySchema = {
  query: paginationQuerySchema.extend({
    farmId: z.string().uuid().optional(),
    fieldId: z.string().uuid().optional(),
    cropCycleId: z.string().uuid().optional(),
    assignedTo: z.string().uuid().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    type: z
      .enum([
        'irrigation',
        'fertilization',
        'pesticide',
        'weeding',
        'planting',
        'harvesting',
        'inspection',
        'other',
      ])
      .optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueFrom: z.coerce.date().optional(),
    dueTo: z.coerce.date().optional(),
  }),
};

export const createTaskSchema = {
  body: z
    .strictObject({
      farmId: z.string().uuid('Valid farmId is required'),
      fieldId: z.string().uuid().nullable().optional(),
      cropCycleId: z.string().uuid().nullable().optional(),
      assignedTo: z.string().uuid().nullable().optional(),
      title: z.string().trim().min(2, 'Task title is required').max(180),
      description: z.string().trim().max(1000).optional(),
      type: z
        .enum([
          'irrigation',
          'fertilization',
          'pesticide',
          'weeding',
          'planting',
          'harvesting',
          'inspection',
          'other',
        ])
        .default('other'),
      dueAt: z.coerce.date().nullable().optional(),
      dueDate: z.coerce.date().nullable().optional(),
      priority: z.string().trim().default('medium'),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
    })
    .transform((data) => {
      const { dueDate, ...rest } = data;
      const effectiveDueAt = rest.dueAt !== undefined ? rest.dueAt : dueDate;
      return {
        ...rest,
        ...(effectiveDueAt !== undefined ? { dueAt: effectiveDueAt } : {}),
      };
    }),
};

export const updateTaskSchema = {
  params: uuidParam('id'),
  body: z
    .strictObject({
      farmId: z.string().uuid().optional(),
      fieldId: z.string().uuid().nullable().optional(),
      cropCycleId: z.string().uuid().nullable().optional(),
      assignedTo: z.string().uuid().nullable().optional(),
      title: z.string().trim().min(2).max(180).optional(),
      description: z.string().trim().max(1000).nullable().optional(),
      type: z
        .enum([
          'irrigation',
          'fertilization',
          'pesticide',
          'weeding',
          'planting',
          'harvesting',
          'inspection',
          'other',
        ])
        .optional(),
      dueAt: z.coerce.date().nullable().optional(),
      dueDate: z.coerce.date().nullable().optional(),
      completedAt: z.coerce.date().nullable().optional(),
      priority: z.string().trim().optional(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    })
    .transform((data) => {
      const { dueDate, farmId, ...rest } = data;
      const result = { ...rest };
      if (rest.dueAt !== undefined || dueDate !== undefined) {
        result.dueAt = rest.dueAt !== undefined ? rest.dueAt : (dueDate ?? null);
      }
      return result;
    })
    .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update'),
};

