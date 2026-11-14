import './setup-env.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../src/modules/auth/auth.validation.js';

import {
  createFarmSchema,
  updateFarmSchema,
} from '../src/modules/farms/farms.validation.js';

import {
  createFieldSchema,
  updateFieldSchema,
} from '../src/modules/fields/fields.validation.js';

import {
  createCropCycleSchema,
  updateCropCycleSchema,
} from '../src/modules/cropCycles/cropCycles.validation.js';

import {
  createTaskSchema,
  updateTaskSchema,
} from '../src/modules/tasks/tasks.validation.js';

import {
  createExpenseSchema,
} from '../src/modules/expenses/expenses.validation.js';

import {
  createHarvestSchema,
} from '../src/modules/harvests/harvests.validation.js';

test('Auth: registerSchema normalizes email and validates password complexity', () => {
  const valid = registerSchema.body.safeParse({
    fullName: 'Ramesh Patil',
    email: '  Farmer@Example.Com ',
    password: 'Password123',
    phone: '+91 98765 43210',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.email, 'farmer@example.com');

  const weakPw = registerSchema.body.safeParse({
    fullName: 'Ramesh Patil',
    email: 'farmer@example.com',
    password: 'short',
  });
  assert.equal(weakPw.success, false);

  const noNumberPw = registerSchema.body.safeParse({
    fullName: 'Ramesh Patil',
    email: 'farmer@example.com',
    password: 'lettersletters',
  });
  assert.equal(noNumberPw.success, false);
});

test('Auth: changePasswordSchema enforces new password to differ from current', () => {
  const same = changePasswordSchema.body.safeParse({
    currentPassword: 'Password123',
    newPassword: 'Password123',
  });
  assert.equal(same.success, false);

  const diff = changePasswordSchema.body.safeParse({
    currentPassword: 'Password123',
    newPassword: 'NewPassword456',
  });
  assert.equal(diff.success, true);
});

test('Auth: forgotPasswordSchema validates email format', () => {
  const valid = forgotPasswordSchema.body.safeParse({ email: ' Farmer@Example.com ' });
  assert.equal(valid.success, true);
  assert.equal(valid.data.email, 'farmer@example.com');

  const invalid = forgotPasswordSchema.body.safeParse({ email: 'not-an-email' });
  assert.equal(invalid.success, false);
});

test('Auth: resetPasswordSchema requires token and strong password', () => {
  const valid = resetPasswordSchema.body.safeParse({
    token: 'valid.token.string',
    newPassword: 'BrandNewPassword1',
  });
  assert.equal(valid.success, true);

  const missingToken = resetPasswordSchema.body.safeParse({
    token: '',
    newPassword: 'BrandNewPassword1',
  });
  assert.equal(missingToken.success, false);

  const weakPassword = resetPasswordSchema.body.safeParse({
    token: 'valid.token.string',
    newPassword: 'weak',
  });
  assert.equal(weakPassword.success, false);
});

test('Farms: createFarmSchema validates positive total area and defaults', () => {
  const valid = createFarmSchema.body.safeParse({
    name: 'Green Valley Farm',
    totalArea: 15.5,
    village: 'Ozar',
    district: 'Nashik',
    state: 'Maharashtra',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.areaUnit, 'acre');
  assert.equal(valid.data.country, 'India');
  assert.equal(valid.data.status, 'active');

  const invalidArea = createFarmSchema.body.safeParse({
    name: 'Green Valley Farm',
    totalArea: -5,
  });
  assert.equal(invalidArea.success, false);
});

test('Fields: createFieldSchema validates area and name', () => {
  const valid = createFieldSchema.body.safeParse({
    name: 'North Plot',
    area: 5.2,
    soilType: 'Clay loam',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.status, 'active');

  const missingName = createFieldSchema.body.safeParse({
    name: '',
    area: 5.2,
  });
  assert.equal(missingName.success, false);
});

test('CropCycles: createCropCycleSchema requires valid UUIDs and positive area', () => {
  const valid = createCropCycleSchema.body.safeParse({
    fieldId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    cropId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    areaCultivated: 3.5,
    season: 'Kharif 2026',
    status: 'active',
  });
  assert.equal(valid.success, true);

  const invalidFieldUuid = createCropCycleSchema.body.safeParse({
    fieldId: 'invalid-uuid-string',
    cropId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    areaCultivated: 3.5,
  });
  assert.equal(invalidFieldUuid.success, false);
});

test('Tasks: createTaskSchema validates type, status and priority', () => {
  const valid = createTaskSchema.body.safeParse({
    farmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Fertilizer application',
    type: 'fertilization',
    priority: 'high',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.status, 'pending');

  const invalidType = createTaskSchema.body.safeParse({
    farmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Unknown task',
    type: 'not_a_valid_type',
  });
  assert.equal(invalidType.success, false);
});

test('Tasks: createTaskSchema and updateTaskSchema handle dueDate/dueAt compatibility', () => {
  const resWithDueDate = createTaskSchema.body.safeParse({
    farmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Morning Drip Irrigation for Onion Crop',
    type: 'irrigation',
    priority: 'high',
    dueDate: '2026-11-15T00:00:00.000Z',
  });
  assert.equal(resWithDueDate.success, true);
  assert.ok(resWithDueDate.data.dueAt instanceof Date);
  assert.equal(resWithDueDate.data.dueDate, undefined);

  const resWithDueAt = createTaskSchema.body.safeParse({
    farmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Evening Weeding',
    type: 'weeding',
    dueAt: '2026-11-16T10:00:00.000Z',
  });
  assert.equal(resWithDueAt.success, true);
  assert.ok(resWithDueAt.data.dueAt instanceof Date);

  const updateWithDueDate = updateTaskSchema.body.safeParse({
    farmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    dueDate: '2026-11-20T00:00:00.000Z',
  });
  assert.equal(updateWithDueDate.success, true);
  assert.ok(updateWithDueDate.data.dueAt instanceof Date);
  assert.equal(updateWithDueDate.data.dueDate, undefined);
  assert.equal(updateWithDueDate.data.farmId, undefined);
});

test('Expenses: createExpenseSchema validates positive amount and valid category', () => {
  const valid = createExpenseSchema.body.safeParse({
    farmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    category: 'seeds',
    description: 'Tomato hybrid seeds',
    amount: 4500,
  });
  assert.equal(valid.success, true);

  const invalidAmount = createExpenseSchema.body.safeParse({
    farmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    category: 'seeds',
    description: 'Tomato hybrid seeds',
    amount: -100,
  });
  assert.equal(invalidAmount.success, false);
});

test('Harvests: createHarvestSchema validates quantity and unit', () => {
  const valid = createHarvestSchema.body.safeParse({
    quantity: 85.5,
    quantityUnit: 'quintal',
    sellingPricePerUnit: 2200,
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.markCycleHarvested, false);
});

