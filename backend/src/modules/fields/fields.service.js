import { prisma } from '../../config/database.js';
import { checkFarmOwnership, checkFieldOwnership } from '../../utils/ownership.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Normalizes and converts area between agricultural units
 */
export const convertAreaToFarmUnit = (area, fromUnit = 'acre', toUnit = 'acre') => {
  const from = (fromUnit || 'acre').toLowerCase().trim();
  const to = (toUnit || 'acre').toLowerCase().trim();
  if (from === to) return Number(area);

  // Conversion factor to standard acre
  const toAcreFactors = {
    acre: 1,
    hectare: 2.47105,
    bigha: 0.625,
    guntha: 0.025,
  };

  const fromFactor = toAcreFactors[from] ?? 1;
  const toFactor = toAcreFactors[to] ?? 1;

  const inAcres = Number(area) * fromFactor;
  return inAcres / toFactor;
};

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
  const farm = await checkFarmOwnership(farmId, userId);

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

  // Enforce Farm Total Capacity Limit
  const farmTotalArea = Number(farm.totalArea);
  const farmUnit = farm.areaUnit || 'acre';

  const existingFields = await prisma.field.findMany({
    where: { farmId },
    select: { area: true, areaUnit: true },
  });

  const currentAllocatedArea = existingFields.reduce((sum, f) => {
    return sum + convertAreaToFarmUnit(f.area, f.areaUnit, farmUnit);
  }, 0);

  const newFieldAreaInFarmUnit = convertAreaToFarmUnit(data.area, data.areaUnit, farmUnit);
  const totalAfterAddition = currentAllocatedArea + newFieldAreaInFarmUnit;

  if (totalAfterAddition > farmTotalArea + 0.001) {
    const remainingCapacity = Math.max(0, farmTotalArea - currentAllocatedArea);
    throw ApiError.badRequest(
      `Field area (${data.area} ${data.areaUnit || 'acre'}) exceeds farm "${farm.name}" capacity. Total capacity is ${farmTotalArea} ${farmUnit}, currently allocated: ${Math.round(currentAllocatedArea * 1000) / 1000} ${farmUnit}, remaining available: ${Math.round(remainingCapacity * 1000) / 1000} ${farmUnit}.`,
      'FARM_CAPACITY_EXCEEDED'
    );
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
          totalArea: true,
          areaUnit: true,
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

  // Enforce Farm Total Capacity Limit on update
  if (data.area !== undefined || data.areaUnit !== undefined) {
    const farm = await prisma.farm.findUnique({
      where: { id: current.farmId },
      select: { name: true, totalArea: true, areaUnit: true },
    });

    if (farm) {
      const farmTotalArea = Number(farm.totalArea);
      const farmUnit = farm.areaUnit || 'acre';

      const otherFields = await prisma.field.findMany({
        where: { farmId: current.farmId, id: { not: fieldId } },
        select: { area: true, areaUnit: true },
      });

      const otherAllocatedArea = otherFields.reduce((sum, f) => {
        return sum + convertAreaToFarmUnit(f.area, f.areaUnit, farmUnit);
      }, 0);

      const targetArea = data.area !== undefined ? data.area : current.area;
      const targetUnit = data.areaUnit !== undefined ? data.areaUnit : current.areaUnit;
      const targetAreaInFarmUnit = convertAreaToFarmUnit(targetArea, targetUnit, farmUnit);
      const totalAfterUpdate = otherAllocatedArea + targetAreaInFarmUnit;

      if (totalAfterUpdate > farmTotalArea + 0.001) {
        const remainingCapacity = Math.max(0, farmTotalArea - otherAllocatedArea);
        throw ApiError.badRequest(
          `Updated field area (${targetArea} ${targetUnit || 'acre'}) exceeds farm "${farm.name}" capacity. Total capacity: ${farmTotalArea} ${farmUnit}, allocated to other fields: ${Math.round(otherAllocatedArea * 1000) / 1000} ${farmUnit}, maximum allowed for this field: ${Math.round(remainingCapacity * 1000) / 1000} ${farmUnit}.`,
          'FARM_CAPACITY_EXCEEDED'
        );
      }
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
