import './setup-env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCycleMetrics } from '../src/modules/cropCycles/cropCycles.service.js';
import { convertAreaToFarmUnit } from '../src/modules/fields/fields.service.js';

test('Business Logic: computes expected yield, estimated revenue and profit accurately', () => {
  const cycle = {
    areaCultivated: 4.0,
    expectedYield: 80, // 80 quintals
    expectedSellingPricePerUnit: 2500, // ₹2,500 per quintal
    status: 'active',
    plantingDate: new Date(Date.now() - 40 * 86_400_000), // 40 days ago
    crop: {
      typicalDurationDays: 120, // 120 days
    },
    harvests: [],
    expenses: [
      { amount: 15000 },
      { amount: 25000 },
    ],
    tasks: [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'pending' },
      { status: 'in_progress' },
    ],
  };

  const metrics = computeCycleMetrics(cycle);

  // Estimated Revenue: 80 * 2500 = 200,000
  assert.equal(metrics.estimatedRevenue, 200000);

  // Attributable Expenses: 15000 + 25000 = 40,000
  assert.equal(metrics.totalAttributableExpenses, 40000);

  // Estimated Profit: 200,000 - 40,000 = 160,000
  assert.equal(metrics.estimatedProfit, 160000);

  // Task completion: 2 / 4 = 50%
  assert.equal(metrics.taskCompletionPercentage, 50);

  // Crop progress: 40 / 120 = 33.33 -> 33%
  assert.equal(metrics.cropProgressPercentage, 33);
});

test('Business Logic: crop progress distinguishes harvested status and clamps to 100%', () => {
  const harvestedCycle = {
    areaCultivated: 2.0,
    expectedYield: 40,
    expectedSellingPricePerUnit: 2000,
    status: 'harvested',
    plantingDate: new Date(Date.now() - 200 * 86_400_000),
    crop: { typicalDurationDays: 100 },
    harvests: [
      { quantity: 42, sellingPricePerUnit: 2100 },
    ],
    expenses: [{ amount: 10000 }],
    tasks: [{ status: 'completed' }],
  };

  const metrics = computeCycleMetrics(harvestedCycle);

  // Harvested status is always 100% progress
  assert.equal(metrics.cropProgressPercentage, 100);

  // Actual harvest: 42 quintals
  assert.equal(metrics.actualHarvestQuantity, 42);

  // Actual revenue: 42 * 2100 = 88,200
  assert.equal(metrics.actualRevenue, 88200);

  // Actual profit: 88,200 - 10,000 = 78,200
  assert.equal(metrics.actualRevenue - metrics.totalAttributableExpenses, 78200);
});

test('Business Logic: task completion percentage is 0 when no tasks exist', () => {
  const cycle = {
    areaCultivated: 1.0,
    status: 'planned',
    crop: { typicalDurationDays: 90 },
    tasks: [],
    expenses: [],
    harvests: [],
  };

  const metrics = computeCycleMetrics(cycle);
  assert.equal(metrics.taskCompletionPercentage, 0);
  assert.equal(metrics.cropProgressPercentage, 0);
});

test('Business Logic: unit conversion and farm capacity allocation checks', () => {
  // Test unit conversion
  assert.equal(convertAreaToFarmUnit(10, 'acre', 'acre'), 10);
  const oneHectareInAcres = convertAreaToFarmUnit(1, 'hectare', 'acre');
  assert.ok(Math.abs(oneHectareInAcres - 2.47105) < 0.001);

  // Farm capacity check logic: Farm has 8.5 acres
  const farmCapacity = 8.5;
  const existingFields = [
    { area: 3.5, areaUnit: 'acre' },
    { area: 2.0, areaUnit: 'acre' },
  ]; // Total allocated: 5.5 acres

  const totalAllocated = existingFields.reduce((sum, f) => {
    return sum + convertAreaToFarmUnit(f.area, f.areaUnit, 'acre');
  }, 0);

  assert.equal(totalAllocated, 5.5);
  const remaining = farmCapacity - totalAllocated; // 3.0 acres
  assert.equal(remaining, 3.0);

  // Attempting to add a field of 3.0 acres should be within capacity
  const validAddition = 3.0;
  assert.ok(totalAllocated + validAddition <= farmCapacity);

  // Attempting to add a field of 3.1 or 4.0 acres should exceed 8.5 capacity
  const invalidAddition = 4.0;
  assert.ok(totalAllocated + invalidAddition > farmCapacity);
});
