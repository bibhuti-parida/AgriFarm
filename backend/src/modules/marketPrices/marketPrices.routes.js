import { Router } from 'express';
import * as controller from './marketPrices.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listMarketPricesQuerySchema,
  latestPricesQuerySchema,
} from './marketPrices.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listMarketPricesQuerySchema), controller.listMarketPrices);
router.get('/latest', validate(latestPricesQuerySchema), controller.getLatestMarketPrices);

export default router;

