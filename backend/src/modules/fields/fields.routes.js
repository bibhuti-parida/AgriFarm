import { Router } from 'express';
import * as controller from './fields.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  fieldIdParamSchema,
  farmIdParamSchema,
  createFieldSchema,
  updateFieldSchema,
} from './fields.validation.js';

// Top-level fields router for /api/v1/fields
export const fieldsRouter = Router();
fieldsRouter.use(authenticate);
fieldsRouter.get('/:id', validate(fieldIdParamSchema), controller.getField);
fieldsRouter.patch('/:id', validate(updateFieldSchema), controller.updateField);
fieldsRouter.delete('/:id', validate(fieldIdParamSchema), controller.deleteField);

// Nested router for /api/v1/farms/:farmId/fields
export const farmFieldsRouter = Router({ mergeParams: true });
farmFieldsRouter.use(authenticate);
farmFieldsRouter.get('/', validate(farmIdParamSchema), controller.listFieldsByFarm);
farmFieldsRouter.post('/', validate(createFieldSchema), controller.createField);

export default fieldsRouter;

