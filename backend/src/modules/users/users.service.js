import { prisma } from '../../config/database.js';
import { publicUserSelect } from '../auth/auth.service.js';

export const listUsers = async (query = {}) => {
  const where = { status: 'active' };
  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: publicUserSelect,
    orderBy: { fullName: 'asc' },
    take: 50,
  });
};

