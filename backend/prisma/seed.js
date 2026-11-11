// Development seed: realistic, idempotent. Refuses to run in production.
// Seeds demo farmer, worker, crop catalog, farm, fields, crop cycles, tasks, expenses and harvest.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed: NODE_ENV=production');
  process.exit(1);
}

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'AgriFarmPassword123';

const d = (iso) => new Date(`${iso}T00:00:00.000Z`);
const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);

const CROPS = [
  { name: 'Rice (Paddy)', category: 'Cereal', typicalDurationDays: 130, defaultYieldPerAcre: 20, yieldUnit: 'quintal', description: 'Kharif staple cereal; transplanted or direct-seeded.' },
  { name: 'Wheat', category: 'Cereal', typicalDurationDays: 125, defaultYieldPerAcre: 18, yieldUnit: 'quintal', description: 'Rabi cereal grain.' },
  { name: 'Maize', category: 'Cereal', typicalDurationDays: 100, defaultYieldPerAcre: 22, yieldUnit: 'quintal', description: 'Versatile cereal grown in kharif and rabi.' },
  { name: 'Cotton', category: 'Fibre', typicalDurationDays: 180, defaultYieldPerAcre: 8, yieldUnit: 'quintal', description: 'Kharif commercial fiber crop.' },
  { name: 'Groundnut', category: 'Oilseed', typicalDurationDays: 110, defaultYieldPerAcre: 8, yieldUnit: 'quintal', description: 'Valuable legume and oilseed crop.' },
  { name: 'Tomato', category: 'Vegetable', typicalDurationDays: 110, defaultYieldPerAcre: 100, yieldUnit: 'quintal', description: 'High-value fresh market vegetable.' },
  { name: 'Onion', category: 'Vegetable', typicalDurationDays: 120, defaultYieldPerAcre: 80, yieldUnit: 'quintal', description: 'Essential bulb vegetable.' },
  { name: 'Sugarcane', category: 'Cash crop', typicalDurationDays: 330, defaultYieldPerAcre: 350, yieldUnit: 'quintal', description: 'Perennial sugar cash crop.' },
];

async function main() {
  console.log('Seeding AgriFarm database...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@agrifarm.dev' },
    update: {},
    create: {
      fullName: 'Ramesh Patil',
      email: 'farmer@agrifarm.dev',
      passwordHash,
      phone: '+91 98765 43210',
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: 'worker@agrifarm.dev' },
    update: {},
    create: {
      fullName: 'Suresh Jadhav',
      email: 'worker@agrifarm.dev',
      passwordHash,
      phone: '+91 98765 12345',
    },
  });

  const crops = {};
  for (const c of CROPS) {
    crops[c.name] = await prisma.cropCatalog.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  const existingFarm = await prisma.farm.findFirst({
    where: { ownerId: farmer.id, name: 'Patil Family Farm' },
  });

  if (existingFarm) {
    console.log('Demo farm already exists — skipping farm records.');
    return;
  }

  const farm = await prisma.farm.create({
    data: {
      ownerId: farmer.id,
      name: 'Patil Family Farm',
      description: 'Mixed cereal and vegetable organic farm.',
      village: 'Ozar',
      district: 'Nashik',
      state: 'Maharashtra',
      country: 'India',
      latitude: 20.0922,
      longitude: 73.9402,
      totalArea: 12.5,
      areaUnit: 'acre',
    },
  });

  const northField = await prisma.field.create({
    data: {
      farmId: farm.id,
      name: 'North Field',
      area: 6.0,
      areaUnit: 'acre',
      soilType: 'Black cotton soil',
      irrigationType: 'Drip',
      notes: 'Well draining soil suitable for vegetables',
    },
  });

  const riverField = await prisma.field.create({
    data: {
      farmId: farm.id,
      name: 'River Plot',
      area: 4.5,
      areaUnit: 'acre',
      soilType: 'Alluvial loam',
      irrigationType: 'Canal',
      notes: 'Fertile river adjacent parcel',
    },
  });

  // 1. Active cycle
  const tomatoCycle = await prisma.cropCycle.create({
    data: {
      fieldId: northField.id,
      cropId: crops['Tomato'].id,
      season: 'Rabi 2026-27',
      plantingDate: daysFromNow(-45),
      expectedHarvestDate: daysFromNow(65),
      areaCultivated: 3.0,
      areaUnit: 'acre',
      expectedYield: 300,
      yieldUnit: 'quintal',
      expectedSellingPricePerUnit: 1800,
      growthStage: 'vegetative',
      healthStatus: 'healthy',
      status: 'active',
      notes: 'Drip irrigated hybrid tomato crop',
    },
  });

  // 2. Planned cycle
  await prisma.cropCycle.create({
    data: {
      fieldId: riverField.id,
      cropId: crops['Wheat'].id,
      season: 'Rabi 2026-27',
      plantingDate: daysFromNow(14),
      expectedHarvestDate: daysFromNow(139),
      areaCultivated: 4.0,
      areaUnit: 'acre',
      expectedYield: 72,
      yieldUnit: 'quintal',
      expectedSellingPricePerUnit: 2400,
      growthStage: 'preparation',
      healthStatus: 'unknown',
      status: 'planned',
      notes: 'Planned certified seed wheat cycle',
    },
  });

  // 3. Harvested cycle
  const pastRiceCycle = await prisma.cropCycle.create({
    data: {
      fieldId: riverField.id,
      cropId: crops['Rice (Paddy)'].id,
      season: 'Kharif 2026',
      plantingDate: d('2026-06-20'),
      expectedHarvestDate: d('2026-10-28'),
      actualHarvestDate: d('2026-10-30'),
      areaCultivated: 4.0,
      areaUnit: 'acre',
      expectedYield: 80,
      yieldUnit: 'quintal',
      expectedSellingPricePerUnit: 2300,
      growthStage: 'harvested',
      healthStatus: 'healthy',
      status: 'harvested',
      notes: 'Completed kharif paddy harvest',
    },
  });

  // Harvest record
  await prisma.harvest.create({
    data: {
      farmId: farm.id,
      fieldId: riverField.id,
      cropCycleId: pastRiceCycle.id,
      harvestedOn: d('2026-10-30'),
      quantity: 76.5,
      quantityUnit: 'quintal',
      grade: 'Grade A',
      sellingPricePerUnit: 2350,
      currency: 'INR',
      buyer: 'Nashik APMC Mandi Trader',
      notes: 'Moisture content 13%, good market price achieved',
    },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        farmId: farm.id,
        fieldId: northField.id,
        cropCycleId: tomatoCycle.id,
        assignedTo: worker.id,
        title: 'Morning drip irrigation',
        description: 'Run drip lines for 2.5 hours across tomato beds',
        type: 'irrigation',
        dueAt: daysFromNow(1),
        priority: 'high',
        status: 'pending',
      },
      {
        farmId: farm.id,
        fieldId: northField.id,
        cropCycleId: tomatoCycle.id,
        title: 'Apply NPK top dressing',
        description: '19:19:19 soluble fertilizer fertigation',
        type: 'fertilization',
        dueAt: daysFromNow(5),
        priority: 'medium',
        status: 'pending',
      },
      {
        farmId: farm.id,
        fieldId: riverField.id,
        title: 'Seedbed preparation for wheat',
        description: 'Rotavator pass and level field bed',
        type: 'planting',
        dueAt: daysFromNow(10),
        priority: 'medium',
        status: 'pending',
      },
      {
        farmId: farm.id,
        fieldId: northField.id,
        cropCycleId: tomatoCycle.id,
        assignedTo: worker.id,
        title: 'Initial weeding & de-suckering',
        description: 'Manual weeding between drip lateral lines',
        type: 'weeding',
        dueAt: daysFromNow(-6),
        completedAt: daysFromNow(-5),
        priority: 'medium',
        status: 'completed',
      },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      {
        farmId: farm.id,
        fieldId: northField.id,
        cropCycleId: tomatoCycle.id,
        recordedBy: farmer.id,
        category: 'seeds',
        description: 'Hybrid tomato nursery trays (3000 seedlings)',
        amount: 9500,
        expenseDate: daysFromNow(-50),
        vendor: 'Kisan Agro Nursery',
      },
      {
        farmId: farm.id,
        fieldId: northField.id,
        cropCycleId: tomatoCycle.id,
        recordedBy: farmer.id,
        category: 'fertilizer',
        description: 'Water soluble fertilizer & micro nutrients',
        amount: 14200,
        expenseDate: daysFromNow(-30),
        vendor: 'Mahalaxmi Krishi Seva Kendra',
      },
      {
        farmId: farm.id,
        fieldId: riverField.id,
        cropCycleId: pastRiceCycle.id,
        recordedBy: farmer.id,
        category: 'labour',
        description: 'Rice harvesting & threshing labour crew',
        amount: 18000,
        expenseDate: d('2026-10-31'),
        vendor: 'Local Farmworkers Collective',
      },
      {
        farmId: farm.id,
        recordedBy: farmer.id,
        category: 'equipment',
        description: 'Drip filter maintenance and pump repair',
        amount: 2400,
        expenseDate: daysFromNow(-12),
        vendor: 'Agro Machinery Repairs',
      },
    ],
  });

  console.log('Seeding completed successfully!');
  console.log(`Demo farmer: farmer@agrifarm.dev`);
  console.log(`Demo worker: worker@agrifarm.dev`);
  console.log(`Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

