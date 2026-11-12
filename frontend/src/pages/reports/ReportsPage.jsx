import React, { useState, useEffect, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext.jsx';
import { reportsApi } from '../../api/reports.api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import Select from '../../components/common/Select.jsx';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters.js';
import { 
  BarChart3, 
  TrendingUp, 
  Receipt, 
  PieChart as PieChartIcon, 
  Scale, 
  Sprout, 
  IndianRupee, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export default function ReportsPage() {
  const { currentFarm, farms } = useFarm();
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [activeTab, setActiveTab] = useState('production'); // 'production' | 'expenses' | 'profitability'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states for the 3 reports
  const [productionData, setProductionData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [profitabilityData, setProfitabilityData] = useState(null);

  useEffect(() => {
    if (currentFarm?.id) {
      setSelectedFarmId(currentFarm.id);
    }
  }, [currentFarm]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = selectedFarmId ? { farmId: selectedFarmId } : {};

      const [prodRes, expRes, profRes] = await Promise.all([
        reportsApi.getProductionReport(params),
        reportsApi.getExpensesReport(params),
        reportsApi.getProfitabilityReport(params),
      ]);

      setProductionData(prodRes.data);
      setExpenseData(expRes.data);
      setProfitabilityData(profRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load agricultural analytics and reports');
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            Reports & Farm Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deep dive into crop yields, input expense trends, and cycle-by-cycle profitability margins.
          </p>
        </div>

        {/* Global Farm Scope Selector */}
        <div className="w-full sm:w-64">
          <Select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            options={[
              { value: '', label: 'All My Farms' },
              ...farms.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('production')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'production'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Production & Yield Variance
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'expenses'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Expense Analytics
        </button>

        <button
          onClick={() => setActiveTab('profitability')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'profitability'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Profitability & ROI
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <LoadingSpinner message="Calculating analytics and generating reports..." />
      ) : (
        <>
          {/* TAB 1: PRODUCTION REPORT */}
          {activeTab === 'production' && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyzed Crop Cycles</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {productionData?.cyclesCount || 0}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Crops Represented</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {productionData?.cropsSummary?.length || 0}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cultivated Parcels</div>
                  <div className="text-3xl font-extrabold text-blue-600 mt-1">
                    {productionData?.detailedCycles?.length || 0}
                  </div>
                </div>
              </div>

              {/* Yield Comparison Bar Chart */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  Expected Yield vs Actual Harvest Quantity
                </h3>

                {productionData?.cropsSummary && productionData.cropsSummary.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionData.cropsSummary} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="cropName" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="expectedYield" name="Expected Output" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actualYield" name="Actual Harvested" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-400">
                    No production cycles recorded yet to display charts.
                  </div>
                )}
              </div>

              {/* Production Variance Ledger */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
                  Crop-Wise Yield & Variance Summary
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3.5 px-4">Crop</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-right">Area (acres)</th>
                        <th className="py-3.5 px-4 text-right">Expected Yield</th>
                        <th className="py-3.5 px-4 text-right">Actual Harvest</th>
                        <th className="py-3.5 px-4 text-right">Variance</th>
                        <th className="py-3.5 px-4 text-right">Achievement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productionData?.cropsSummary?.map((crop, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {crop.cropName}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {crop.category || 'Agricultural'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                            {crop.totalAreaCultivated}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600">
                            {crop.expectedYield} {crop.yieldUnit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                            {crop.actualYield} {crop.yieldUnit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-0.5 ${
                                crop.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {crop.variance >= 0 ? '+' : ''}
                              {crop.variance} {crop.yieldUnit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold">
                            {crop.achievementRate != null ? (
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  crop.achievementRate >= 100
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {crop.achievementRate}%
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPENSE ANALYTICS */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Aggregated Spending</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(expenseData?.totalExpenses || 0)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expense Categories</div>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {expenseData?.byCategory?.length || 0}
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Spending Trend */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Monthly Farm Spending Trend
                  </h3>
                  {expenseData?.monthlyTrend && expenseData.monthlyTrend.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={expenseData.monthlyTrend}>
                          <defs>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#expenseGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-sm text-slate-400">
                      No monthly trend data available.
                    </div>
                  )}
                </div>

                {/* Category Breakdown Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-emerald-600" />
                    Spending by Input Category
                  </h3>
                  {expenseData?.byCategory && expenseData.byCategory.length > 0 ? (
                    <div className="h-64 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseData.byCategory}
                            dataKey="amount"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                          >
                            {expenseData.byCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Spent']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-sm text-slate-400">
                      No expenses recorded to breakdown.
                    </div>
                  )}
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
                  Categorical Expenditure Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-center">Entries</th>
                        <th className="py-3.5 px-4 text-right">Total Amount</th>
                        <th className="py-3.5 px-4 text-right">Share of Spending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenseData?.byCategory?.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold capitalize text-slate-900">
                            {cat.category}
                          </td>
                          <td className="py-3.5 px-4 text-center text-xs text-slate-600">
                            {cat.recordCount} records
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(cat.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                            {cat.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROFITABILITY & ROI */}
          {activeTab === 'profitability' && (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attributable Costs</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(profitabilityData?.summary?.totalAttributableExpenses || 0)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Revenue</div>
                  <div className="text-2xl font-extrabold text-blue-600 mt-1">
                    {formatCurrency(profitabilityData?.summary?.totalEstimatedRevenue || 0)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Realized Revenue</div>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {formatCurrency(profitabilityData?.summary?.totalActualRevenue || 0)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Realized Profit</div>
                  <div
                    className={`text-2xl font-extrabold mt-1 ${
                      (profitabilityData?.summary?.totalActualProfit || 0) >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(profitabilityData?.summary?.totalActualProfit || 0)}
                  </div>
                </div>
              </div>

              {/* Cycle-by-Cycle Profitability Ledger */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
                  Crop Cycle Profitability & Return on Investment (ROI)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3.5 px-4">Cycle</th>
                        <th className="py-3.5 px-4">Farm / Field</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Cycle Expenses</th>
                        <th className="py-3.5 px-4 text-right">Est. Revenue</th>
                        <th className="py-3.5 px-4 text-right">Realized Revenue</th>
                        <th className="py-3.5 px-4 text-right">Net Profit</th>
                        <th className="py-3.5 px-4 text-right">ROI %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profitabilityData?.cycles?.map((cycle) => (
                        <tr key={cycle.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {cycle.crop}
                            <span className="text-xs font-normal text-slate-500 block">
                              {cycle.season} ({cycle.areaCultivated} ac)
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <div className="font-semibold text-slate-800">{cycle.farm}</div>
                            <div className="text-slate-400">{cycle.field}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="capitalize text-xs font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {cycle.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                            {formatCurrency(cycle.expenses)}
                          </td>

                          <td className="py-3.5 px-4 text-right text-slate-600">
                            {formatCurrency(cycle.estimatedRevenue)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                            {formatCurrency(cycle.actualRevenue)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                            <span
                              className={cycle.actualProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}
                            >
                              {formatCurrency(cycle.actualProfit)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold">
                            {cycle.roiPercentage != null ? (
                              <span
                                className={`px-2 py-0.5 rounded text-xs inline-flex items-center gap-0.5 ${
                                  cycle.roiPercentage >= 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {cycle.roiPercentage >= 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {cycle.roiPercentage}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
