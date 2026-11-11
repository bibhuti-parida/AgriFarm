import { Router } from 'express';
import * as controller from './farms.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  farmIdParamSchema,
  listFarmsQuerySchema,
  createFarmSchema,
  updateFarmSchema,
} from './farms.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listFarmsQuerySchema), controller.listFarms);
router.post('/', validate(createFarmSchema), controller.createFarm);
router.get('/:id', validate(farmIdParamSchema), controller.getFarm);
router.patch('/:id', validate(updateFarmSchema), controller.updateFarm);
router.delete('/:id', validate(farmIdParamSchema), controller.deleteFarm);

export default router;

