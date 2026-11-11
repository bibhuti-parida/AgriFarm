import { prisma } from '../../config/database.js';
import { checkFarmOwnership, checkExpenseOwnership } from '../../utils/ownership.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildPaginationMeta } from '../../utils/ApiResponse.js';

export const listExpenses = async (userId, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    farm: { ownerId: userId },
  };

  if (query.farmId) where.farmId = query.farmId;
  if (query.fieldId) where.fieldId = query.fieldId;
  if (query.cropCycleId) where.cropCycleId = query.cropCycleId;
  if (query.category) where.category = query.category;
  if (query.startDate || query.endDate) {
    where.expenseDate = {};
    if (query.startDate) where.expenseDate.gte = query.startDate;
    if (query.endDate) where.expenseDate.lte = query.endDate;
  }
  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: 'insensitive' } },
      { vendor: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, expenses, aggregate] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'expenseDate']: query.sortOrder || 'desc' },
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
        recorder: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  return {
    expenses,
    summary: {
      totalAmount: aggregate._sum.amount ? Number(aggregate._sum.amount) : 0,
      currency: 'INR',
    },
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const createExpense = async (userId, data) => {
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
      where: { id: data.cropCycleId, field: { farmId: data.farmId } },
    });
    if (!cycle) {
      throw ApiError.badRequest('Crop cycle does not belong to specified farm', 'CYCLE_FARM_MISMATCH');
    }
  }

  return prisma.expense.create({
    data: {
      ...data,
      recordedBy: userId,
    },
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      recorder: { select: { id: true, fullName: true, email: true } },
    },
  });
};

export const getExpenseById = async (userId, expenseId) => {
  return checkExpenseOwnership(expenseId, userId);
};

export const updateExpense = async (userId, expenseId, data) => {
  const current = await checkExpenseOwnership(expenseId, userId);

  if (data.fieldId) {
    const field = await prisma.field.findFirst({
      where: { id: data.fieldId, farmId: current.farmId },
    });
    if (!field) {
      throw ApiError.badRequest('Field does not belong to this farm', 'FIELD_FARM_MISMATCH');
    }
  }

  if (data.cropCycleId) {
    const cycle = await prisma.cropCycle.findFirst({
      where: { id: data.cropCycleId, field: { farmId: current.farmId } },
    });
    if (!cycle) {
      throw ApiError.badRequest('Crop cycle does not belong to this farm', 'CYCLE_FARM_MISMATCH');
    }
  }

  return prisma.expense.update({
    where: { id: expenseId },
    data,
    include: {
      farm: { select: { id: true, name: true } },
      field: { select: { id: true, name: true } },
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      recorder: { select: { id: true, fullName: true, email: true } },
    },
  });
};

export const deleteExpense = async (userId, expenseId) => {
  await checkExpenseOwnership(expenseId, userId);

  return prisma.expense.delete({
    where: { id: expenseId },
  });
};

