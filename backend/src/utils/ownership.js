import { prisma } from '../config/database.js';
import { ApiError } from './ApiError.js';

export const checkFarmOwnership = async (farmId, userId) => {
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, ownerId: userId },
  });
  if (!farm) {
    throw ApiError.notFound('Farm not found', 'FARM_NOT_FOUND');
  }
  return farm;
};

export const checkFieldOwnership = async (fieldId, userId) => {
  const field = await prisma.field.findFirst({
    where: {
      id: fieldId,
      farm: { ownerId: userId },
    },
    include: {
      farm: { select: { id: true, name: true, ownerId: true } },
    },
  });
  if (!field) {
    throw ApiError.notFound('Field not found', 'FIELD_NOT_FOUND');
  }
  return field;
};

export const checkCropCycleOwnership = async (cropCycleId, userId) => {
  const cropCycle = await prisma.cropCycle.findFirst({
    where: {
      id: cropCycleId,
      field: {
        farm: { ownerId: userId },
      },
    },
    include: {
      field: {
        select: {
          id: true,
          name: true,
          farmId: true,
          farm: { select: { id: true, name: true, ownerId: true } },
        },
      },
      crop: true,
    },
  });
  if (!cropCycle) {
    throw ApiError.notFound('Crop cycle not found', 'CROP_CYCLE_NOT_FOUND');
  }
  return cropCycle;
};

export const checkTaskOwnership = async (taskId, userId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      farm: { ownerId: userId },
    },
    include: {
      farm: { select: { id: true, name: true, ownerId: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      assignee: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!task) {
    throw ApiError.notFound('Task not found', 'TASK_NOT_FOUND');
  }
  return task;
};

export const checkExpenseOwnership = async (expenseId, userId) => {
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      farm: { ownerId: userId },
    },
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true } },
    },
  });
  if (!expense) {
    throw ApiError.notFound('Expense not found', 'EXPENSE_NOT_FOUND');
  }
  return expense;
};

export const checkHarvestOwnership = async (harvestId, userId) => {
  const harvest = await prisma.harvest.findFirst({
    where: {
      id: harvestId,
      farm: { ownerId: userId },
    },
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
    },
  });
  if (!harvest) {
    throw ApiError.notFound('Harvest record not found', 'HARVEST_NOT_FOUND');
  }
  return harvest;
};

