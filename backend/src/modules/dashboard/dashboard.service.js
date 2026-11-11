import { prisma } from '../../config/database.js';
import { checkFarmOwnership } from '../../utils/ownership.js';

export const getDashboardSummary = async (userId, filters = {}) => {
  const { farmId, startDate, endDate } = filters;

  if (farmId) {
    await checkFarmOwnership(farmId, userId);
  }

  const farmWhere = { ownerId: userId };
  if (farmId) farmWhere.id = farmId;

  const totalFarms = await prisma.farm.count({ where: farmWhere });

  // Crop cycles scope
  const cycleWhere = {
    field: { farm: farmWhere },
  };

  // Active cycles query (used to prevent double counting historical cycles)
  const activeCycles = await prisma.cropCycle.findMany({
    where: {
      ...cycleWhere,
      status: 'active',
    },
    include: {
      crop: true,
      field: { select: { id: true, name: true, farmId: true } },
      expenses: { select: { amount: true } },
    },
  });

  const [activeCount, plannedCount, harvestedCount] = await Promise.all([
    prisma.cropCycle.count({ where: { ...cycleWhere, status: 'active' } }),
    prisma.cropCycle.count({ where: { ...cycleWhere, status: 'planned' } }),
    prisma.cropCycle.count({ where: { ...cycleWhere, status: 'harvested' } }),
  ]);

  // Aggregate active cycles area, expected yield, and estimated revenue
  let totalCultivatedArea = 0;
  let expectedYield = 0;
  let estimatedRevenue = 0;
  let activeCyclesAttributableExpenses = 0;

  for (const c of activeCycles) {
    const area = Number(c.areaCultivated) || 0;
    totalCultivatedArea += area;

    const y = c.expectedYield != null ? Number(c.expectedYield) : 0;
    expectedYield += y;

    const p = c.expectedSellingPricePerUnit != null ? Number(c.expectedSellingPricePerUnit) : 0;
    estimatedRevenue += y * p;

    for (const exp of c.expenses || []) {
      activeCyclesAttributableExpenses += Number(exp.amount) || 0;
    }
  }

  // Estimated profit for active cycles: Estimated revenue - attributable expenses
  const estimatedProfit = Math.round((estimatedRevenue - activeCyclesAttributableExpenses) * 100) / 100;

  // Tasks statistics
  const taskWhere = {
    farm: farmWhere,
  };
  const [totalTasks, completedTasks, pendingTasks, inProgressTasks, upcomingTasks] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: 'completed' } }),
    prisma.task.count({ where: { ...taskWhere, status: 'pending' } }),
    prisma.task.count({ where: { ...taskWhere, status: 'in_progress' } }),
    prisma.task.count({
      where: {
        ...taskWhere,
        status: { in: ['pending', 'in_progress'] },
        OR: [{ dueAt: { gte: new Date() } }, { dueAt: null }],
      },
    }),
  ]);

  const taskCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Expenses query (filtered by date if provided)
  const expenseWhere = {
    farm: farmWhere,
  };
  if (startDate || endDate) {
    expenseWhere.expenseDate = {};
    if (startDate) expenseWhere.expenseDate.gte = startDate;
    if (endDate) expenseWhere.expenseDate.lte = endDate;
  }

  const [totalExpensesAgg, categoryExpenses] = await Promise.all([
    prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: expenseWhere,
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalExpenses = totalExpensesAgg._sum.amount ? Number(totalExpensesAgg._sum.amount) : 0;

  // Harvests & actual sales
  const harvestWhere = {
    farm: farmWhere,
  };
  if (startDate || endDate) {
    harvestWhere.harvestedOn = {};
    if (startDate) harvestWhere.harvestedOn.gte = startDate;
    if (endDate) harvestWhere.harvestedOn.lte = endDate;
  }

  const allHarvests = await prisma.harvest.findMany({
    where: harvestWhere,
    select: { quantity: true, sellingPricePerUnit: true },
  });

  let actualHarvestQuantity = 0;
  let actualRevenue = 0;
  for (const h of allHarvests) {
    const qty = Number(h.quantity) || 0;
    actualHarvestQuantity += qty;
    if (h.sellingPricePerUnit != null) {
      actualRevenue += qty * Number(h.sellingPricePerUnit);
    }
  }
  const actualProfit = Math.round((actualRevenue - totalExpenses) * 100) / 100;

  // Crop distribution for Recharts
  const cropDistributionMap = new Map();
  for (const c of activeCycles) {
    const cropName = c.crop?.name || 'Unknown';
    const area = Number(c.areaCultivated) || 0;
    cropDistributionMap.set(cropName, (cropDistributionMap.get(cropName) || 0) + area);
  }
  const cropDistribution = Array.from(cropDistributionMap.entries()).map(([name, area]) => ({
    name,
    area: Math.round(area * 100) / 100,
  }));

  // Recharts: Expenses by category
  const expensesByCategory = categoryExpenses.map((c) => ({
    category: c.category,
    amount: c._sum.amount ? Number(c._sum.amount) : 0,
    count: c._count.id,
  }));

  // Tasks by priority for Recharts
  const tasksByPriority = await prisma.task.groupBy({
    by: ['priority'],
    where: taskWhere,
    _count: { id: true },
  });

  // Recent activity feed across tasks, expenses, harvests, crop cycles
  const [recentTasks, recentExpenses, recentHarvests] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      take: 4,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        farm: { select: { name: true } },
      },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        category: true,
        amount: true,
        expenseDate: true,
        createdAt: true,
        farm: { select: { name: true } },
      },
    }),
    prisma.harvest.findMany({
      where: harvestWhere,
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        quantity: true,
        quantityUnit: true,
        harvestedOn: true,
        createdAt: true,
        cropCycle: { select: { crop: { select: { name: true } } } },
        farm: { select: { name: true } },
      },
    }),
  ]);

  const recentActivities = [
    ...recentTasks.map((t) => ({
      id: t.id,
      type: 'task',
      title: `Task: ${t.title}`,
      description: `Status: ${t.status} (${t.priority} priority) - ${t.farm.name}`,
      timestamp: t.updatedAt,
    })),
    ...recentExpenses.map((e) => ({
      id: e.id,
      type: 'expense',
      title: `Expense: ${e.description}`,
      description: `₹${Number(e.amount).toLocaleString('en-IN')} [${e.category}] - ${e.farm.name}`,
      timestamp: e.createdAt,
    })),
    ...recentHarvests.map((h) => ({
      id: h.id,
      type: 'harvest',
      title: `Harvest: ${h.cropCycle?.crop?.name || 'Crop'}`,
      description: `${Number(h.quantity)} ${h.quantityUnit} harvested - ${h.farm.name}`,
      timestamp: h.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

  return {
    metrics: {
      totalFarms,
      totalCultivatedArea: Math.round(totalCultivatedArea * 100) / 100,
      areaUnit: 'acre',
      activeCropCycles: activeCount,
      plannedCropCycles: plannedCount,
      harvestedCropCycles: harvestedCount,
      totalTasks,
      upcomingTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      taskCompletionPercentage,
      totalExpenses,
      expectedYield: Math.round(expectedYield * 1000) / 1000,
      estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      estimatedProfit,
      actualHarvestQuantity: Math.round(actualHarvestQuantity * 1000) / 1000,
      actualRevenue: Math.round(actualRevenue * 100) / 100,
      actualProfit,
      currency: 'INR',
    },
    visualizations: {
      cropDistribution,
      expensesByCategory,
      tasksByStatus: [
        { status: 'completed', count: completedTasks },
        { status: 'in_progress', count: inProgressTasks },
        { status: 'pending', count: pendingTasks },
      ],
      tasksByPriority: tasksByPriority.map((p) => ({
        priority: p.priority,
        count: p._count.id,
      })),
    },
    recentActivities,
  };
};

export const getProductionReport = async (userId, filters = {}) => {
  const { farmId, startDate, endDate } = filters;
  if (farmId) await checkFarmOwnership(farmId, userId);

  const farmWhere = { ownerId: userId };
  if (farmId) farmWhere.id = farmId;

  const cycleWhere = {
    field: { farm: farmWhere },
  };

  const cropCycles = await prisma.cropCycle.findMany({
    where: cycleWhere,
    include: {
      crop: true,
      field: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } },
      harvests: {
        orderBy: { harvestedOn: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const productionByCrop = new Map();
  for (const c of cropCycles) {
    const cropName = c.crop?.name || 'Other';
    if (!productionByCrop.has(cropName)) {
      productionByCrop.set(cropName, {
        cropName,
        category: c.crop?.category,
        totalAreaCultivated: 0,
        expectedYield: 0,
        actualYield: 0,
        yieldUnit: c.yieldUnit || c.crop?.yieldUnit || 'quintal',
        cyclesCount: 0,
      });
    }

    const data = productionByCrop.get(cropName);
    data.totalAreaCultivated += Number(c.areaCultivated) || 0;
    data.expectedYield += Number(c.expectedYield) || 0;
    data.cyclesCount += 1;

    for (const h of c.harvests || []) {
      data.actualYield += Number(h.quantity) || 0;
    }
  }

  const cropsSummary = Array.from(productionByCrop.values()).map((c) => ({
    ...c,
    totalAreaCultivated: Math.round(c.totalAreaCultivated * 100) / 100,
    expectedYield: Math.round(c.expectedYield * 1000) / 1000,
    actualYield: Math.round(c.actualYield * 1000) / 1000,
    variance: Math.round((c.actualYield - c.expectedYield) * 1000) / 1000,
    achievementRate: c.expectedYield > 0 ? Math.round((c.actualYield / c.expectedYield) * 100) : null,
  }));

  return {
    cropsSummary,
    cyclesCount: cropCycles.length,
    detailedCycles: cropCycles.map((c) => {
      const actualQuantity = (c.harvests || []).reduce((acc, h) => acc + (Number(h.quantity) || 0), 0);
      return {
        id: c.id,
        crop: c.crop.name,
        season: c.season,
        field: c.field.name,
        farm: c.field.farm.name,
        status: c.status,
        areaCultivated: Number(c.areaCultivated),
        expectedYield: c.expectedYield ? Number(c.expectedYield) : null,
        actualYield: actualQuantity,
        yieldUnit: c.yieldUnit,
        harvestDate: c.actualHarvestDate || c.expectedHarvestDate,
      };
    }),
  };
};

export const getExpensesReport = async (userId, filters = {}) => {
  const { farmId, startDate, endDate } = filters;
  if (farmId) await checkFarmOwnership(farmId, userId);

  const farmWhere = { ownerId: userId };
  if (farmId) farmWhere.id = farmId;

  const expenseWhere = { farm: farmWhere };
  if (startDate || endDate) {
    expenseWhere.expenseDate = {};
    if (startDate) expenseWhere.expenseDate.gte = startDate;
    if (endDate) expenseWhere.expenseDate.lte = endDate;
  }

  const [categoryBreakdown, allExpenses] = await Promise.all([
    prisma.expense.groupBy({
      by: ['category'],
      where: expenseWhere,
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      orderBy: { expenseDate: 'asc' },
      select: { amount: true, expenseDate: true, category: true },
    }),
  ]);

  const totalExpenses = categoryBreakdown.reduce((sum, c) => sum + (Number(c._sum.amount) || 0), 0);

  // Monthly trend grouping
  const monthlyTrendMap = new Map();
  for (const exp of allExpenses) {
    const monthKey = new Date(exp.expenseDate).toISOString().slice(0, 7); // YYYY-MM
    monthlyTrendMap.set(monthKey, (monthlyTrendMap.get(monthKey) || 0) + Number(exp.amount));
  }

  const monthlyTrend = Array.from(monthlyTrendMap.entries()).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 100) / 100,
  }));

  const byCategory = categoryBreakdown.map((c) => {
    const amount = Number(c._sum.amount) || 0;
    return {
      category: c.category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      recordCount: c._count.id,
    };
  });

  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    currency: 'INR',
    byCategory,
    monthlyTrend,
  };
};

export const getProfitabilityReport = async (userId, filters = {}) => {
  const { farmId } = filters;
  if (farmId) await checkFarmOwnership(farmId, userId);

  const farmWhere = { ownerId: userId };
  if (farmId) farmWhere.id = farmId;

  const cropCycles = await prisma.cropCycle.findMany({
    where: {
      field: { farm: farmWhere },
    },
    include: {
      crop: true,
      field: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } },
      expenses: { select: { amount: true } },
      harvests: { select: { quantity: true, sellingPricePerUnit: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let grandEstimatedRevenue = 0;
  let grandActualRevenue = 0;
  let grandExpenses = 0;

  const cycleReports = cropCycles.map((c) => {
    const expenses = (c.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expYield = c.expectedYield ? Number(c.expectedYield) : 0;
    const expPrice = c.expectedSellingPricePerUnit ? Number(c.expectedSellingPricePerUnit) : 0;
    const estimatedRevenue = expYield * expPrice;

    const actualRevenue = (c.harvests || []).reduce((sum, h) => {
      return sum + (Number(h.quantity) || 0) * (Number(h.sellingPricePerUnit) || 0);
    }, 0);

    const estimatedProfit = estimatedRevenue - expenses;
    const actualProfit = actualRevenue - expenses;

    grandEstimatedRevenue += estimatedRevenue;
    grandActualRevenue += actualRevenue;
    grandExpenses += expenses;

    return {
      id: c.id,
      crop: c.crop.name,
      field: c.field.name,
      farm: c.field.farm.name,
      season: c.season,
      status: c.status,
      areaCultivated: Number(c.areaCultivated),
      expenses,
      estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      estimatedProfit: Math.round(estimatedProfit * 100) / 100,
      actualRevenue: Math.round(actualRevenue * 100) / 100,
      actualProfit: Math.round(actualProfit * 100) / 100,
      roiPercentage: expenses > 0 ? Math.round((actualProfit / expenses) * 100) : null,
    };
  });

  return {
    summary: {
      totalAttributableExpenses: Math.round(grandExpenses * 100) / 100,
      totalEstimatedRevenue: Math.round(grandEstimatedRevenue * 100) / 100,
      totalEstimatedProfit: Math.round((grandEstimatedRevenue - grandExpenses) * 100) / 100,
      totalActualRevenue: Math.round(grandActualRevenue * 100) / 100,
      totalActualProfit: Math.round((grandActualRevenue - grandExpenses) * 100) / 100,
      currency: 'INR',
    },
    cycles: cycleReports,
  };
};

