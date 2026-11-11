import { Router } from 'express';
import * as controller from './crops.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate, uuidParam } from '../../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.listCrops);
router.get('/:id', validate({ params: uuidParam('id') }), controller.getCrop);

export default router;

