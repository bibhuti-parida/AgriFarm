import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { buildPaginationMeta } from '../../utils/ApiResponse.js';

/**
 * Agricultural Market Price Provider Interface (e.g. data.gov.in / Agmarknet APMC mandi prices API)
 * Does NOT generate fake data. If external provider API key is not configured, documents
 * integration status and works transparently with verified stored records.
 */
export const getProviderStatus = () => {
  const isConfigured = Boolean(env.MARKET_DATA_API_KEY && env.MARKET_DATA_API_KEY.length > 5);
  return {
    provider: 'Agmarknet / Open Government Data (data.gov.in)',
    isConfigured,
    note: isConfigured
      ? 'Market price sync provider configured and ready'
      : 'External market API key not configured (set MARKET_DATA_API_KEY in .env). Serving recorded market prices.',
  };
};

export const listMarketPrices = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.cropId) where.cropId = query.cropId;
  if (query.cropName) where.cropName = { contains: query.cropName, mode: 'insensitive' };
  if (query.marketName) where.marketName = { contains: query.marketName, mode: 'insensitive' };
  if (query.district) where.district = { contains: query.district, mode: 'insensitive' };
  if (query.state) where.state = { contains: query.state, mode: 'insensitive' };
  if (query.startDate || query.endDate) {
    where.priceDate = {};
    if (query.startDate) where.priceDate.gte = query.startDate;
    if (query.endDate) where.priceDate.lte = query.endDate;
  }
  if (query.search) {
    where.OR = [
      { cropName: { contains: query.search, mode: 'insensitive' } },
      { marketName: { contains: query.search, mode: 'insensitive' } },
      { district: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, prices] = await Promise.all([
    prisma.marketPrice.count({ where }),
    prisma.marketPrice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'priceDate']: query.sortOrder || 'desc' },
      include: {
        crop: { select: { id: true, name: true, category: true } },
      },
    }),
  ]);

  return {
    prices,
    providerStatus: getProviderStatus(),
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

export const getLatestMarketPrices = async (query = {}) => {
  const where = {};
  if (query.cropName) where.cropName = { contains: query.cropName, mode: 'insensitive' };
  if (query.state) where.state = { contains: query.state, mode: 'insensitive' };
  if (query.district) where.district = { contains: query.district, mode: 'insensitive' };

  // Fetch recent distinct crop prices
  const prices = await prisma.marketPrice.findMany({
    where,
    orderBy: { priceDate: 'desc' },
    take: 50,
    include: {
      crop: { select: { id: true, name: true, category: true } },
    },
  });

  // Group by cropName and marketName to provide latest snapshot
  const seen = new Set();
  const latestPrices = [];
  for (const item of prices) {
    const key = `${item.cropName.toLowerCase()}_${item.marketName.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      latestPrices.push(item);
    }
  }

  return {
    latestPrices,
    count: latestPrices.length,
    providerStatus: getProviderStatus(),
  };
};

