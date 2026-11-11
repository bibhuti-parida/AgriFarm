import { prisma } from '../../config/database.js';
import { checkCropCycleOwnership, checkHarvestOwnership } from '../../utils/ownership.js';
import { buildPaginationMeta } from '../../utils/ApiResponse.js';

export const listHarvestsByCycle = async (userId, cropCycleId) => {
  await checkCropCycleOwnership(cropCycleId, userId);

  return prisma.harvest.findMany({
    where: { cropCycleId },
    orderBy: { harvestedOn: 'desc' },
    include: {
      cropCycle: {
        select: {
          id: true,
          season: true,
          crop: { select: { name: true } },
        },
      },
      field: { select: { id: true, name: true } },
      farm: { select: { id: true, name: true } },
    },
  });
};

export const listAllHarvests = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    farm: { ownerId: userId },
  };

  if (query.farmId) where.farmId = query.farmId;
  if (query.fieldId) where.fieldId = query.fieldId;
  if (query.cropCycleId) where.cropCycleId = query.cropCycleId;
  if (query.startDate || query.endDate) {
    where.harvestedOn = {};
    if (query.startDate) where.harvestedOn.gte = query.startDate;
    if (query.endDate) where.harvestedOn.lte = query.endDate;
  }

  const [total, harvests, aggregate] = await Promise.all([
    prisma.harvest.count({ where }),
    prisma.harvest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'harvestedOn']: query.sortOrder || 'desc' },
      include: {
        cropCycle: {
          select: {
            id: true,
            season: true,
            crop: { select: { name: true } },
          },
        },
        field: { select: { id: true, name: true } },
        farm: { select: { id: true, name: true } },
      },
    }),
    prisma.harvest.aggregate({
      where,
      _sum: { quantity: true },
    }),
  ]);

  return {
    harvests,
    summary: {
      totalQuantity: aggregate._sum.quantity ? Number(aggregate._sum.quantity) : 0,
    },
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const createHarvest = async (userId, cropCycleId, data) => {
  const cycle = await checkCropCycleOwnership(cropCycleId, userId);
  const { markCycleHarvested, ...harvestData } = data;

  const harvest = await prisma.harvest.create({
    data: {
      ...harvestData,
      cropCycleId,
      fieldId: cycle.fieldId,
      farmId: cycle.field.farmId,
    },
    include: {
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      field: { select: { id: true, name: true } },
      farm: { select: { id: true, name: true } },
    },
  });

  if (markCycleHarvested) {
    await prisma.cropCycle.update({
      where: { id: cropCycleId },
      data: {
        status: 'harvested',
        growthStage: 'harvested',
        actualHarvestDate: harvestData.harvestedOn || new Date(),
      },
    });
  }

  return harvest;
};

export const getHarvestById = async (userId, harvestId) => {
  return checkHarvestOwnership(harvestId, userId);
};

export const updateHarvest = async (userId, harvestId, data) => {
  await checkHarvestOwnership(harvestId, userId);

  return prisma.harvest.update({
    where: { id: harvestId },
    data,
    include: {
      cropCycle: { select: { id: true, season: true, crop: { select: { name: true } } } },
      field: { select: { id: true, name: true } },
      farm: { select: { id: true, name: true } },
    },
  });
};

export const deleteHarvest = async (userId, harvestId) => {
  await checkHarvestOwnership(harvestId, userId);

  return prisma.harvest.delete({
    where: { id: harvestId },
  });
};

