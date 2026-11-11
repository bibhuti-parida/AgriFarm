import { Router } from 'express';
import * as controller from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { dashboardFilterSchema } from './dashboard.validation.js';

// Router for /api/v1/dashboard
export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/summary', validate(dashboardFilterSchema), controller.getSummary);

// Router for /api/v1/reports
export const reportsRouter = Router();
reportsRouter.use(authenticate);
reportsRouter.get('/production', validate(dashboardFilterSchema), controller.getProductionReport);
reportsRouter.get('/expenses', validate(dashboardFilterSchema), controller.getExpensesReport);
reportsRouter.get('/profitability', validate(dashboardFilterSchema), controller.getProfitabilityReport);

export default dashboardRouter;

