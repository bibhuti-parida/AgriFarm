import * as expensesService from './expenses.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listExpenses = asyncHandler(async (req, res) => {
  const { expenses, summary, meta } = await expensesService.listExpenses(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Expenses retrieved successfully', data: { expenses, summary }, meta });
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expensesService.createExpense(req.user.id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Expense recorded successfully', data: { expense } });
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await expensesService.getExpenseById(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Expense details retrieved', data: { expense } });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expensesService.updateExpense(req.user.id, req.params.id, req.body);
  sendSuccess(res, { message: 'Expense updated successfully', data: { expense } });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await expensesService.deleteExpense(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Expense deleted successfully', data: null });
});

