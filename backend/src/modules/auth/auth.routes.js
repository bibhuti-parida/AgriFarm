import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isTest } from '../../config/env.js';
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';

const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later',
    error: { code: 'RATE_LIMITED' },
  },
});

const router = Router();

router.post('/register', credentialLimiter, validate(registerSchema), controller.register);
router.post('/login', credentialLimiter, validate(loginSchema), controller.login);
router.post('/forgot-password', credentialLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', credentialLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, validate(updateMeSchema), controller.updateMe);
router.post('/change-password', authenticate, credentialLimiter, validate(changePasswordSchema), controller.changePassword);


export default router;

