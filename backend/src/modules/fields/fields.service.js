import { prisma } from '../../config/database.js';
import { checkFarmOwnership, checkFieldOwnership } from '../../utils/ownership.js';
import { ApiError } from '../../utils/ApiError.js';

export const listFieldsByFarm = async (userId, farmId, query = {}) => {
  await checkFarmOwnership(farmId, userId);

  const where = { farmId };
  if (query.status) {
    where.status = query.status;
  }

  const fields = await prisma.field.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      cropCycles: {
        where: { status: 'active' },
        include: { crop: true },
      },
      _count: {
        select: {
          cropCycles: true,
          tasks: true,
          expenses: true,
          harvests: true,
        },
      },
    },
  });

  return fields;
};

export const createField = async (userId, farmId, data) => {
  await checkFarmOwnership(farmId, userId);

  const existing = await prisma.field.findUnique({
    where: {
      farmId_name: {
        farmId,
        name: data.name,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict('A field with this name already exists on this farm', 'FIELD_NAME_EXISTS');
  }

  return prisma.field.create({
    data: {
      ...data,
      farmId,
    },
  });
};

export const getFieldById = async (userId, fieldId) => {
  await checkFieldOwnership(fieldId, userId);

  return prisma.field.findUnique({
    where: { id: fieldId },
    include: {
      farm: {
        select: {
          id: true,
          name: true,
          district: true,
          state: true,
        },
      },
      cropCycles: {
        orderBy: { createdAt: 'desc' },
        include: { crop: true },
      },
      _count: {
        select: {
          cropCycles: true,
          tasks: true,
          expenses: true,
          harvests: true,
        },
      },
    },
  });
};

export const updateField = async (userId, fieldId, data) => {
  const current = await checkFieldOwnership(fieldId, userId);

  if (data.name && data.name !== current.name) {
    const duplicate = await prisma.field.findUnique({
      where: {
        farmId_name: {
          farmId: current.farmId,
          name: data.name,
        },
      },
    });
    if (duplicate) {
      throw ApiError.conflict('Another field with this name already exists on this farm', 'FIELD_NAME_EXISTS');
    }
  }

  return prisma.field.update({
    where: { id: fieldId },
    data,
  });
};

export const deleteField = async (userId, fieldId) => {
  await checkFieldOwnership(fieldId, userId);

  return prisma.field.delete({
    where: { id: fieldId },
  });
};

