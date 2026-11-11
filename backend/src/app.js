import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env, isTest } from './config/env.js';
import { notFound } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import farmsRoutes from './modules/farms/farms.routes.js';
import fieldsRoutes, { farmFieldsRouter } from './modules/fields/fields.routes.js';
import cropsRoutes from './modules/crops/crops.routes.js';
import cropCyclesRoutes from './modules/cropCycles/cropCycles.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';
import expensesRoutes from './modules/expenses/expenses.routes.js';
import harvestsRoutes, { cycleHarvestsRouter } from './modules/harvests/harvests.routes.js';
import weatherRoutes from './modules/weather/weather.routes.js';
import marketPricesRoutes from './modules/marketPrices/marketPrices.routes.js';
import dashboardRoutes, { reportsRouter } from './modules/dashboard/dashboard.routes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = env.FRONTEND_URL.split(',').map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps or curl) and configured origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Logging
if (!isTest) {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Request body parsing
app.use(express.json({ limit: '1mb' }));

// Global Rate Limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      error: { code: 'RATE_LIMITED' },
    },
  })
);

// API Health Check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    message: 'AgriFarm REST API is operational',
    data: {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount Resource Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);

// Farms and Farm-nested resources
app.use('/api/v1/farms/:farmId/fields', farmFieldsRouter);
app.use('/api/v1/farms/:farmId/weather', weatherRoutes);
app.use('/api/v1/farms', farmsRoutes);

// Fields
app.use('/api/v1/fields', fieldsRoutes);

// Crops & Crop Cycles
app.use('/api/v1/crops', cropsRoutes);
app.use('/api/v1/crop-cycles/:cropCycleId/harvests', cycleHarvestsRouter);
app.use('/api/v1/crop-cycles', cropCyclesRoutes);

// Tasks, Expenses, Harvests
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/harvests', harvestsRoutes);

// Market Prices & Weather
app.use('/api/v1/market-prices', marketPricesRoutes);

// Dashboard Analytics & Reports
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportsRouter);

// 404 & Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

export default app;

