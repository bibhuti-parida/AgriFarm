import React, { useState, useEffect, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext.jsx';
import { dashboardApi } from '../../api/dashboard.api.js';
import { formatCurrency, formatNumber, formatArea, formatYield } from '../../utils/formatters.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../../components/common/ErrorAlert.jsx';
import { Button } from '../../components/common/Button.jsx';
import {
  Sprout,
  TrendingUp,
  Receipt,
  CheckSquare,
  Wheat,
  Activity,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export const Dashboard = () => {
  const { selectedFarmId, selectedFarm } = useFarm();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedFarmId) params.farmId = selectedFarmId;
      const res = await dashboardApi.getSummary(params);
      setData(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading && !data) {
    return <LoadingSpinner text="Calculating agricultural analytics..." />;
  }

  if (error && !data) {
    return <ErrorAlert message={error} onRetry={fetchSummary} className="my-6" />;
  }

  const metrics = data?.metrics || {};
  const visualizations = data?.visualizations || {};
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Farm Operations Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {selectedFarm ? selectedFarm.name : 'All Agricultural Operations'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-xl">
            {selectedFarm
              ? `Real-time management for ${selectedFarm.totalArea} ${selectedFarm.areaUnit} in ${selectedFarm.district || selectedFarm.state || 'India'}.`
              : 'Consolidated overview across all active farms, fields, and cultivation cycles.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            loading={loading}
            icon={RefreshCw}
            className="border-emerald-600 text-emerald-100 hover:bg-emerald-800"
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchSummary} />}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cultivated Area */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cultivated Area
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatArea(metrics.totalCultivatedArea, metrics.areaUnit)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across <span className="font-semibold text-emerald-600">{metrics.activeCropCycles}</span> active cycles
            </p>
          </div>
        </div>

        {/* Card 2: Estimated Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estimated Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.estimatedRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Actual Sales: <span className="font-semibold text-slate-700">{formatCurrency(metrics.actualRevenue)}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.totalExpenses)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Estimated Profit: <span className={`font-semibold ${metrics.estimatedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(metrics.estimatedProfit)}
              </span>
            </p>
          </div>
        </div>

        {/* Card 4: Task Completion */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Task Completion
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.taskCompletionPercentage}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full"
                style={{ width: `${metrics.taskCompletionPercentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              <span className="font-semibold text-slate-700">{metrics.completedTasks}</span> completed of {metrics.totalTasks} tasks
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Crop Acreage Distribution</h3>
              <p className="text-xs text-slate-500">Active cultivated area by crop variety</p>
            </div>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {visualizations.cropDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visualizations.cropDistribution}
                    dataKey="area"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {visualizations.cropDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${formatNumber(val)} acres`, 'Cultivated Area']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400">No active crops currently planted</div>
            )}
          </div>
        </div>

        {/* Expenses by Category Bar Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expenses by Category</h3>
              <p className="text-xs text-slate-500">Resource outflows breakdown</p>
            </div>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {visualizations.expensesByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visualizations.expensesByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Amount']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400">No recorded expenses found</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Feeds */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Farm Activities</h3>
            <p className="text-xs text-slate-500">Live operational events logged across your holdings</p>
          </div>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>

        {recentActivities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div key={`${act.type}-${act.id}`} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                      act.type === 'task'
                        ? 'bg-amber-50 text-amber-700'
                        : act.type === 'expense'
                        ? 'bg-rose-50 text-rose-700'
                        : act.type === 'harvest'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {act.type === 'task' ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : act.type === 'expense' ? (
                      <Receipt className="w-4 h-4" />
                    ) : act.type === 'harvest' ? (
                      <Wheat className="w-4 h-4" />
                    ) : (
                      <Sprout className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{act.title}</p>
                    <p className="text-[11px] text-slate-500">{act.description}</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(act.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No recent activity recorded yet</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
