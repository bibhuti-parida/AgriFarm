import React, { useState, useEffect, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { expensesApi } from '../../api/expenses.api.js';
import { fieldsApi } from '../../api/fields.api.js';
import { cropsApi } from '../../api/crops.api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Badge from '../../components/common/Badge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { 
  Receipt, 
  Plus, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Edit3, 
  MapPin, 
  Sprout, 
  Building2, 
  FileText 
} from 'lucide-react';

export default function ExpensesList() {
  const { currentFarm, farms } = useFarm();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals & confirmation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Dynamic farm dependencies for the form
  const [farmFields, setFarmFields] = useState([]);
  const [farmCycles, setFarmCycles] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    farmId: '',
    fieldId: '',
    cropCycleId: '',
    category: 'seeds',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    vendor: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentFarm?.id) {
      setSelectedFarmId(currentFarm.id);
    }
  }, [currentFarm]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (selectedFarmId) params.farmId = selectedFarmId;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await expensesApi.list(params);
      setExpenses(res.data?.expenses || []);
      setMeta(res.meta || { page: 1, limit: 15, total: res.data?.expenses?.length || 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [page, selectedFarmId, categoryFilter, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const loadFarmDependencies = async (farmId) => {
    if (!farmId) {
      setFarmFields([]);
      setFarmCycles([]);
      return;
    }
    try {
      const [fRes, cRes] = await Promise.all([
        fieldsApi.listByFarm(farmId),
        cropsApi.listCycles({ farmId })
      ]);
      setFarmFields(fRes.data?.fields || []);
      setFarmCycles(cRes.data?.cropCycles || []);
    } catch (e) {
      console.warn('Error loading farm fields/cycles', e);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultFarm = selectedFarmId || currentFarm?.id || (farms[0]?.id || '');
    setEditingExpense(null);
    setFormData({
      farmId: defaultFarm,
      fieldId: '',
      cropCycleId: '',
      category: 'seeds',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().slice(0, 10),
      vendor: '',
    });
    setFormErrors({});
    if (defaultFarm) loadFarmDependencies(defaultFarm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      farmId: expense.farmId,
      fieldId: expense.fieldId || '',
      cropCycleId: expense.cropCycleId || '',
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().slice(0, 10) : '',
      vendor: expense.vendor || '',
    });
    setFormErrors({});
    loadFarmDependencies(expense.farmId);
    setIsModalOpen(true);
  };

  const handleFarmChangeInForm = (newFarmId) => {
    setFormData((prev) => ({
      ...prev,
      farmId: newFarmId,
      fieldId: '',
      cropCycleId: '',
    }));
    loadFarmDependencies(newFarmId);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.farmId) errs.farmId = 'Farm is required';
    if (!formData.description?.trim()) errs.description = 'Description is required';
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount = 'Amount must be greater than zero';
    if (!formData.expenseDate) errs.expenseDate = 'Expense date is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        farmId: formData.farmId,
        fieldId: formData.fieldId || null,
        cropCycleId: formData.cropCycleId || null,
        category: formData.category,
        description: formData.description.trim(),
        amount: Number(formData.amount),
        currency: 'INR',
        expenseDate: new Date(formData.expenseDate).toISOString(),
        vendor: formData.vendor?.trim() || undefined,
      };

      if (editingExpense) {
        await expensesApi.update(editingExpense.id, payload);
        showToast('Expense record updated', 'success');
      } else {
        await expensesApi.create(payload);
        showToast('Expense recorded successfully', 'success');
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteConfirmId) return;
    try {
      await expensesApi.delete(deleteConfirmId);
      showToast('Expense record deleted', 'success');
      setDeleteConfirmId(null);
      fetchExpenses();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  // Compute total expenses for current page
  const pageTotalExpense = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
            Farm Expenses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track operational spending, fertilizer purchases, seeds, labour, and maintenance costs.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
          Record Expense
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* KPI Highlight Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Page Total Spending</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(pageTotalExpense)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded Entries</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{meta.total || expenses.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Scope</div>
            <div className="text-lg font-bold text-slate-900 mt-1 truncate">
              {currentFarm ? currentFarm.name : 'All Farms'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Farm Filter</label>
          <Select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All My Farms' },
              ...farms.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'seeds', label: 'Seeds' },
              { value: 'fertilizer', label: 'Fertilizer' },
              { value: 'pesticide', label: 'Pesticides' },
              { value: 'labour', label: 'Labour' },
              { value: 'irrigation', label: 'Irrigation' },
              { value: 'equipment', label: 'Equipment & Fuel' },
              { value: 'transportation', label: 'Transportation' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <LoadingSpinner message="Loading farm expenses..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description="Record an operational expense or adjust your date range filters."
          actionText="Record First Expense"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Farm / Field</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(expense.expenseDate)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {expense.description}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                        {expense.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {expense.farm?.name || 'Farm'}
                      </div>
                      {expense.field && (
                        <div className="text-slate-500 pl-4 text-[11px]">
                          Field: {expense.field.name}
                        </div>
                      )}
                      {expense.cropCycle && (
                        <div className="text-emerald-600 pl-4 text-[11px] font-medium flex items-center gap-0.5">
                          <Sprout className="w-2.5 h-2.5" />
                          {expense.cropCycle.crop?.name || 'Cycle'}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {expense.vendor || <span className="text-slate-400">—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(expense)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Expense"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(expense.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={meta.limit}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Record / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Record Farm Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. 5 bags of Urea 46% N fertilizer"
            error={formErrors.description}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Farm *</label>
              <Select
                value={formData.farmId}
                onChange={(e) => handleFarmChangeInForm(e.target.value)}
                options={farms.map((f) => ({ value: f.id, label: f.name }))}
              />
              {formErrors.farmId && <p className="text-xs text-rose-500 mt-1">{formErrors.farmId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'seeds', label: 'Seeds' },
                  { value: 'fertilizer', label: 'Fertilizer' },
                  { value: 'pesticide', label: 'Pesticides' },
                  { value: 'labour', label: 'Labour' },
                  { value: 'irrigation', label: 'Irrigation' },
                  { value: 'equipment', label: 'Equipment & Machinery' },
                  { value: 'transportation', label: 'Transportation' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'other', label: 'Other Operational' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (₹) *"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              error={formErrors.amount}
            />

            <Input
              label="Expense Date *"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              error={formErrors.expenseDate}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Field (Optional)</label>
              <Select
                value={formData.fieldId}
                onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                options={[
                  { value: '', label: '-- None (General Farm) --' },
                  ...farmFields.map((f) => ({ value: f.id, label: `${f.name} (${f.area} ${f.areaUnit})` })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Cycle (Optional)</label>
              <Select
                value={formData.cropCycleId}
                onChange={(e) => setFormData({ ...formData, cropCycleId: e.target.value })}
                options={[
                  { value: '', label: '-- None --' },
                  ...farmCycles.map((c) => ({
                    value: c.id,
                    label: `${c.crop?.name || 'Crop'} - ${c.season} (${c.field?.name})`,
                  })),
                ]}
              />
            </div>
          </div>

          <Input
            label="Vendor / Supplier Name"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            placeholder="e.g. Kisan Agro Center, Sambalpur"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This will affect farm profitability reports."
      />
    </div>
  );
}
