import { prisma } from '../../config/database.js';
import { checkFarmOwnership, checkTaskOwnership } from '../../utils/ownership.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildPaginationMeta } from '../../utils/ApiResponse.js';

export const listTasks = async (userId, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    farm: { ownerId: userId },
  };

  if (query.farmId) where.farmId = query.farmId;
  if (query.fieldId) where.fieldId = query.fieldId;
  if (query.cropCycleId) where.cropCycleId = query.cropCycleId;
  if (query.assignedTo) where.assignedTo = query.assignedTo;
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.priority) where.priority = query.priority;
  if (query.dueFrom || query.dueTo) {
    where.dueAt = {};
    if (query.dueFrom) where.dueAt.gte = query.dueFrom;
    if (query.dueTo) where.dueAt.lte = query.dueTo;
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'dueAt']: query.sortOrder || 'asc' },
      include: {
        farm: { select: { id: true, name: true } },
        field: { select: { id: true, name: true } },
        cropCycle: {
          select: {
            id: true,
            season: true,
            crop: { select: { name: true } },
          },
        },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    }),
  ]);

  return {
    tasks,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const createTask = async (userId, data) => {
  await checkFarmOwnership(data.farmId, userId);

  if (data.fieldId) {
    const field = await prisma.field.findFirst({
      where: { id: data.fieldId, farmId: data.farmId },
    });
    if (!field) {
      throw ApiError.badRequest('Field does not belong to specified farm', 'FIELD_FARM_MISMATCH');
    }
  }

  if (data.cropCycleId) {
    const cycle = await prisma.cropCycle.findFirst({
      where: {
        id: data.cropCycleId,
        field: { farmId: data.farmId },
      },
    });
    if (!cycle) {
      throw ApiError.badRequest('Crop cycle does not belong to specified farm', 'CYCLE_FARM_MISMATCH');
    }
  }

  return prisma.task.create({
    data,
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      assignee: { select: { id: true, fullName: true, email: true } },
    },
  });
};

export const getTaskById = async (userId, taskId) => {
  return checkTaskOwnership(taskId, userId);
};

export const updateTask = async (userId, taskId, data) => {
  const existing = await checkTaskOwnership(taskId, userId);

  if (data.fieldId) {
    const field = await prisma.field.findFirst({
      where: { id: data.fieldId, farmId: existing.farmId },
    });
    if (!field) {
      throw ApiError.badRequest('Field does not belong to this farm', 'FIELD_FARM_MISMATCH');
    }
  }

  if (data.cropCycleId) {
    const cycle = await prisma.cropCycle.findFirst({
      where: { id: data.cropCycleId, field: { farmId: existing.farmId } },
    });
    if (!cycle) {
      throw ApiError.badRequest('Crop cycle does not belong to this farm', 'CYCLE_FARM_MISMATCH');
    }
  }

  return prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      assignee: { select: { id: true, fullName: true, email: true } },
    },
  });
};

export const completeTask = async (userId, taskId) => {
  await checkTaskOwnership(taskId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      assignee: { select: { id: true, fullName: true, email: true } },
    },
  });
};

export const deleteTask = async (userId, taskId) => {
  await checkTaskOwnership(taskId, userId);

  return prisma.task.delete({
    where: { id: taskId },
  });
};

