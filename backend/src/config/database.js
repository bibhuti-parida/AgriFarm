import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Preserve a single client instance to prevent connection leaks during development reload
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

