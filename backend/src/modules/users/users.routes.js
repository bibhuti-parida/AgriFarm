import { Router } from 'express';
import * as controller from './users.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', controller.listUsers);

export default router;

