import { Router } from 'express';
import * as controller from './cropCycles.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  cropCycleIdParamSchema,
  listCropCyclesQuerySchema,
  createCropCycleSchema,
  updateCropCycleSchema,
} from './cropCycles.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listCropCyclesQuerySchema), controller.listCropCycles);
router.post('/', validate(createCropCycleSchema), controller.createCropCycle);
router.get('/:id', validate(cropCycleIdParamSchema), controller.getCropCycle);
router.patch('/:id', validate(updateCropCycleSchema), controller.updateCropCycle);
router.delete('/:id', validate(cropCycleIdParamSchema), controller.deleteCropCycle);

export default router;

