import { Router } from 'express';
import * as controller from './tasks.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  taskIdParamSchema,
  listTasksQuerySchema,
  createTaskSchema,
  updateTaskSchema,
} from './tasks.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listTasksQuerySchema), controller.listTasks);
router.post('/', validate(createTaskSchema), controller.createTask);
router.get('/:id', validate(taskIdParamSchema), controller.getTask);
router.patch('/:id', validate(updateTaskSchema), controller.updateTask);
router.patch('/:id/complete', validate(taskIdParamSchema), controller.completeTask);
router.delete('/:id', validate(taskIdParamSchema), controller.deleteTask);

export default router;

