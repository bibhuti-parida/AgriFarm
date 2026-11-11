import { Router } from 'express';
import * as controller from './expenses.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  expenseIdParamSchema,
  listExpensesQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
} from './expenses.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listExpensesQuerySchema), controller.listExpenses);
router.post('/', validate(createExpenseSchema), controller.createExpense);
router.get('/:id', validate(expenseIdParamSchema), controller.getExpense);
router.patch('/:id', validate(updateExpenseSchema), controller.updateExpense);
router.delete('/:id', validate(expenseIdParamSchema), controller.deleteExpense);

export default router;

