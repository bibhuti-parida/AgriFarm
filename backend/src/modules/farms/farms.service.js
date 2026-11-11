import { prisma } from '../../config/database.js';
import { checkFarmOwnership } from '../../utils/ownership.js';
import { buildPaginationMeta } from '../../utils/ApiResponse.js';

export const listFarms = async (userId, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    ownerId: userId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    const s = query.search;
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { village: { contains: s, mode: 'insensitive' } },
      { district: { contains: s, mode: 'insensitive' } },
      { state: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [total, farms] = await Promise.all([
    prisma.farm.count({ where }),
    prisma.farm.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      include: {
        _count: {
          select: {
            fields: true,
            tasks: true,
            expenses: true,
            harvests: true,
          },
        },
      },
    }),
  ]);

  return {
    farms,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const createFarm = async (userId, data) => {
  return prisma.farm.create({
    data: {
      ...data,
      ownerId: userId,
    },
  });
};

export const getFarmById = async (userId, farmId) => {
  await checkFarmOwnership(farmId, userId);

  return prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      fields: {
        include: {
          cropCycles: {
            where: { status: 'active' },
            include: { crop: true },
          },
        },
      },
      weatherRecords: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          fields: true,
          tasks: true,
          expenses: true,
          harvests: true,
        },
      },
    },
  });
};

export const updateFarm = async (userId, farmId, data) => {
  await checkFarmOwnership(farmId, userId);

  return prisma.farm.update({
    where: { id: farmId },
    data,
  });
};

export const deleteFarm = async (userId, farmId) => {
  await checkFarmOwnership(farmId, userId);

  return prisma.farm.delete({
    where: { id: farmId },
  });
};

