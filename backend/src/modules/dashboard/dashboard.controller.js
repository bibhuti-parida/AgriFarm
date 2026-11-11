import * as dashboardService from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardSummary(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Dashboard summary retrieved successfully', data });
});

export const getProductionReport = asyncHandler(async (req, res) => {
  const data = await dashboardService.getProductionReport(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Production report retrieved successfully', data });
});

export const getExpensesReport = asyncHandler(async (req, res) => {
  const data = await dashboardService.getExpensesReport(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Expenses report retrieved successfully', data });
});

export const getProfitabilityReport = asyncHandler(async (req, res) => {
  const data = await dashboardService.getProfitabilityReport(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Profitability report retrieved successfully', data });
});

