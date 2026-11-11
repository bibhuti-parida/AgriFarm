import { prisma } from '../../config/database.js';
import { checkFieldOwnership, checkCropCycleOwnership } from '../../utils/ownership.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildPaginationMeta } from '../../utils/ApiResponse.js';

export const computeCycleMetrics = (cycle) => {
  const area = Number(cycle.areaCultivated) || 0;
  const expYield = cycle.expectedYield != null ? Number(cycle.expectedYield) : null;
  const expPrice = cycle.expectedSellingPricePerUnit != null ? Number(cycle.expectedSellingPricePerUnit) : null;
  const estimatedRevenue = expYield != null && expPrice != null ? Math.round(expYield * expPrice * 100) / 100 : 0;

  // Actual harvest sum
  const harvests = cycle.harvests || [];
  const actualHarvestQuantity = harvests.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
  const actualRevenue = harvests.reduce((sum, h) => {
    const qty = Number(h.quantity) || 0;
    const price = Number(h.sellingPricePerUnit) || 0;
    return sum + qty * price;
  }, 0);

  // Attributable expenses sum
  const expenses = cycle.expenses || [];
  const totalAttributableExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Tasks metrics
  const tasks = cycle.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Crop progress calculation (elapsed cultivation days / expected crop duration * 100)
  // Clearly distinguished from crop health
  let cropProgressPercentage = 0;
  if (cycle.status === 'harvested') {
    cropProgressPercentage = 100;
  } else if (cycle.status === 'active' && cycle.plantingDate) {
    const start = new Date(cycle.plantingDate).getTime();
    const now = Date.now();
    const elapsedDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

    let durationDays = cycle.crop?.typicalDurationDays;
    if (!durationDays && cycle.expectedHarvestDate) {
      const expHarvest = new Date(cycle.expectedHarvestDate).getTime();
      durationDays = Math.max(1, Math.floor((expHarvest - start) / (1000 * 60 * 60 * 24)));
    }

    if (durationDays && durationDays > 0) {
      cropProgressPercentage = Math.min(100, Math.max(0, Math.round((elapsedDays / durationDays) * 100)));
    }
  }

  const estimatedProfit = estimatedRevenue - totalAttributableExpenses;
  const actualProfit = actualRevenue - totalAttributableExpenses;

  return {
    cropProgressPercentage,
    estimatedRevenue,
    estimatedProfit,
    actualHarvestQuantity,
    actualRevenue,
    totalAttributableExpenses,
    totalTasks,
    completedTasks,
    taskCompletionPercentage,
  };
};

export const listCropCycles = async (userId, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    field: {
      farm: { ownerId: userId },
    },
  };

  if (query.farmId) {
    where.field.farmId = query.farmId;
  }
  if (query.fieldId) {
    where.fieldId = query.fieldId;
  }
  if (query.cropId) {
    where.cropId = query.cropId;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.healthStatus) {
    where.healthStatus = query.healthStatus;
  }
  if (query.growthStage) {
    where.growthStage = query.growthStage;
  }
  if (query.season) {
    where.season = { contains: query.season, mode: 'insensitive' };
  }

  const [total, rawCycles] = await Promise.all([
    prisma.cropCycle.count({ where }),
    prisma.cropCycle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      include: {
        crop: true,
        field: {
          select: {
            id: true,
            name: true,
            farmId: true,
            farm: { select: { id: true, name: true } },
          },
        },
        harvests: { select: { quantity: true, sellingPricePerUnit: true } },
        expenses: { select: { amount: true } },
        tasks: { select: { status: true } },
      },
    }),
  ]);

  const cropCycles = rawCycles.map((c) => ({
    ...c,
    metrics: computeCycleMetrics(c),
  }));

  return {
    cropCycles,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const createCropCycle = async (userId, data) => {
  const field = await checkFieldOwnership(data.fieldId, userId);

  const crop = await prisma.cropCatalog.findUnique({
    where: { id: data.cropId },
  });
  if (!crop) {
    throw ApiError.notFound('Selected crop does not exist in catalog', 'CROP_NOT_FOUND');
  }

  let expectedYield = data.expectedYield;
  let yieldUnit = data.yieldUnit || crop.yieldUnit;

  // Expected yield: Cultivated area × expected yield per acre, after unit conversion
  if (expectedYield == null && crop.defaultYieldPerAcre != null) {
    expectedYield = Math.round(Number(data.areaCultivated) * Number(crop.defaultYieldPerAcre) * 1000) / 1000;
  }

  let expectedHarvestDate = data.expectedHarvestDate;
  if (!expectedHarvestDate && data.plantingDate && crop.typicalDurationDays) {
    const pDate = new Date(data.plantingDate);
    expectedHarvestDate = new Date(pDate.getTime() + crop.typicalDurationDays * 86_400_000);
  }

  const created = await prisma.cropCycle.create({
    data: {
      ...data,
      expectedYield,
      yieldUnit,
      expectedHarvestDate,
    },
    include: {
      crop: true,
      field: {
        select: {
          id: true,
          name: true,
          farmId: true,
          farm: { select: { id: true, name: true } },
        },
      },
    },
  });

  return {
    ...created,
    metrics: computeCycleMetrics(created),
  };
};

export const getCropCycleById = async (userId, cropCycleId) => {
  await checkCropCycleOwnership(cropCycleId, userId);

  const cycle = await prisma.cropCycle.findUnique({
    where: { id: cropCycleId },
    include: {
      crop: true,
      field: {
        select: {
          id: true,
          name: true,
          farmId: true,
          farm: { select: { id: true, name: true, district: true, state: true } },
        },
      },
      harvests: {
        orderBy: { harvestedOn: 'desc' },
      },
      expenses: {
        orderBy: { expenseDate: 'desc' },
      },
      tasks: {
        orderBy: { dueAt: 'asc' },
        include: {
          assignee: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  return {
    ...cycle,
    metrics: computeCycleMetrics(cycle),
  };
};

export const updateCropCycle = async (userId, cropCycleId, data) => {
  await checkCropCycleOwnership(cropCycleId, userId);

  const updated = await prisma.cropCycle.update({
    where: { id: cropCycleId },
    data,
    include: {
      crop: true,
      field: {
        select: {
          id: true,
          name: true,
          farmId: true,
          farm: { select: { id: true, name: true } },
        },
      },
      harvests: { select: { quantity: true, sellingPricePerUnit: true } },
      expenses: { select: { amount: true } },
      tasks: { select: { status: true } },
    },
  });

  return {
    ...updated,
    metrics: computeCycleMetrics(updated),
  };
};

export const deleteCropCycle = async (userId, cropCycleId) => {
  await checkCropCycleOwnership(cropCycleId, userId);

  return prisma.cropCycle.delete({
    where: { id: cropCycleId },
  });
};

