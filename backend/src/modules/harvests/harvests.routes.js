import { Router } from 'express';
import * as controller from './harvests.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  harvestIdParamSchema,
  cropCycleIdParamSchema,
  createHarvestSchema,
  updateHarvestSchema,
  listHarvestsQuerySchema,
} from './harvests.validation.js';

// Top-level router for /api/v1/harvests
export const harvestsRouter = Router();
harvestsRouter.use(authenticate);
harvestsRouter.get('/', validate(listHarvestsQuerySchema), controller.listAllHarvests);
harvestsRouter.get('/:id', validate(harvestIdParamSchema), controller.getHarvest);
harvestsRouter.patch('/:id', validate(updateHarvestSchema), controller.updateHarvest);
harvestsRouter.delete('/:id', validate(harvestIdParamSchema), controller.deleteHarvest);

// Nested router for /api/v1/crop-cycles/:cropCycleId/harvests
export const cycleHarvestsRouter = Router({ mergeParams: true });
cycleHarvestsRouter.use(authenticate);
cycleHarvestsRouter.get('/', validate(cropCycleIdParamSchema), controller.listHarvestsByCycle);
cycleHarvestsRouter.post('/', validate(createHarvestSchema), controller.createHarvest);

export default harvestsRouter;

