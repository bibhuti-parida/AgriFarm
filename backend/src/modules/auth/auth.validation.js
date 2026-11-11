import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().email('Invalid email address format').max(255));

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must not exceed 72 bytes')
  .refine(
    (v) => /[A-Za-z]/.test(v) && /\d/.test(v),
    'Password must contain at least one letter and one number'
  );

const phone = z
  .string()
  .trim()
  .min(5, 'Phone number must be at least 5 characters')
  .max(30, 'Phone number must not exceed 30 characters')
  .regex(/^[0-9+()\-\s]+$/, 'Phone may only contain digits, spaces, +, -, and parentheses');

export const registerSchema = {
  body: z.strictObject({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
    email,
    password,
    phone: phone.optional(),
  }),
};

export const loginSchema = {
  body: z.strictObject({
    email,
    password: z.string().min(1, 'Password is required').max(200),
  }),
};

export const updateMeSchema = {
  body: z
    .strictObject({
      fullName: z.string().trim().min(2).max(120).optional(),
      phone: phone.nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update'),
};

export const changePasswordSchema = {
  body: z
    .strictObject({
      currentPassword: z.string().min(1, 'Current password is required').max(200),
      newPassword: password,
    })
    .refine((v) => v.currentPassword !== v.newPassword, {
      path: ['newPassword'],
      message: 'New password must be different from current password',
    }),
};

export const forgotPasswordSchema = {
  body: z.strictObject({
    email,
  }),
};

export const resetPasswordSchema = {
  body: z.strictObject({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: password,
  }),
};


