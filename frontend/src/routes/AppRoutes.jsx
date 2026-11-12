import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';

// Auth Pages
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';

// Application Pages
import Dashboard from '../pages/dashboard/Dashboard.jsx';
import FarmsList from '../pages/farms/FarmsList.jsx';
import FarmDetail from '../pages/farms/FarmDetail.jsx';
import FieldsList from '../pages/fields/FieldsList.jsx';
import CropCyclesList from '../pages/crops/CropCyclesList.jsx';
import CropCatalog from '../pages/crops/CropCatalog.jsx';
import TasksList from '../pages/tasks/TasksList.jsx';
import ExpensesList from '../pages/expenses/ExpensesList.jsx';
import HarvestsList from '../pages/harvests/HarvestsList.jsx';
import WeatherPage from '../pages/weather/WeatherPage.jsx';
import MarketPricesPage from '../pages/marketPrices/MarketPricesPage.jsx';
import ReportsPage from '../pages/reports/ReportsPage.jsx';
import ProfilePage from '../pages/profile/ProfilePage.jsx';
import NotFound from '../pages/notFound/NotFound.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected SaaS Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Farm & Parcel Management */}
        <Route path="/farms" element={<FarmsList />} />
        <Route path="/farms/:id" element={<FarmDetail />} />
        <Route path="/fields" element={<FieldsList />} />

        {/* Crops & Cultivation Cycles */}
        <Route path="/crop-cycles" element={<CropCyclesList />} />
        <Route path="/crops" element={<Navigate to="/crop-cycles" replace />} />
        <Route path="/crop-catalog" element={<CropCatalog />} />

        {/* Daily Operations, Inputs & Harvest Outputs */}
        <Route path="/tasks" element={<TasksList />} />
        <Route path="/expenses" element={<ExpensesList />} />
        <Route path="/harvests" element={<HarvestsList />} />

        {/* Telemetry, Market Rates & Analytics */}
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/market-prices" element={<MarketPricesPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* User Account Settings */}
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
