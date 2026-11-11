import { prisma } from '../../config/database.js';
import { buildPaginationMeta } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

export const listCrops = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.category) {
    where.category = { equals: query.category, mode: 'insensitive' };
  }
  if (query.search) {
    const s = query.search;
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { category: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [total, crops] = await Promise.all([
    prisma.cropCatalog.count({ where }),
    prisma.cropCatalog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    crops,
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const getCropById = async (id) => {
  const crop = await prisma.cropCatalog.findUnique({
    where: { id },
  });
  if (!crop) {
    throw ApiError.notFound('Crop not found in catalog', 'CROP_NOT_FOUND');
  }
  return crop;
};

