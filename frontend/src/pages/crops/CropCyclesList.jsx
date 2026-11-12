import React, { useState, useEffect, useCallback } from 'react';
import { cropsApi } from '../../api/crops.api.js';
import { fieldsApi } from '../../api/fields.api.js';
import { useFarm } from '../../context/FarmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  formatCurrency,
  formatArea,
  formatYield,
  formatDate,
  formatNumber,
} from '../../utils/formatters.js';
import {
  CROP_CYCLE_STATUSES,
  GROWTH_STAGES,
  CROP_HEALTH_STATUSES,
} from '../../utils/constants.js';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ErrorAlert } from '../../components/common/ErrorAlert.jsx';
import {
  Sprout,
  Plus,
  Calendar,
  TrendingUp,
  Activity,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';

export const CropCyclesList = () => {
  const { selectedFarmId, farms } = useFarm();
  const { success, error: toastError } = useToast();

  const [cycles, setCycles] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Available Fields & Crops for Creation
  const [availableFields, setAvailableFields] = useState([]);
  const [catalogCrops, setCatalogCrops] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [formData, setFormData] = useState({
    fieldId: '',
    cropId: '',
    season: 'Rabi 2026-27',
    plantingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    areaCultivated: '',
    areaUnit: 'acre',
    expectedYield: '',
    yieldUnit: 'quintal',
    expectedSellingPricePerUnit: '',
    growthStage: 'preparation',
    healthStatus: 'healthy',
    status: 'active',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingCycle, setDeletingCycle] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load auxiliary fields and crop catalog for modal dropdowns
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [cropsRes] = await Promise.all([cropsApi.listCatalog({ limit: 100 })]);
        setCatalogCrops(cropsRes?.data?.crops || []);
      } catch (err) {
        console.error('Failed to load crop catalog options:', err);
      }
    };
    loadDropdownData();
  }, []);

  // When a farm is selected or modal opened, load fields for that farm
  useEffect(() => {
    const loadFields = async () => {
      if (!selectedFarmId && farms.length > 0) {
        const all = [];
        for (const f of farms) {
          try {
            const res = await fieldsApi.listByFarm(f.id);
            all.push(...(res?.data?.fields || []).map((fld) => ({ ...fld, farmName: f.name })));
          } catch {}
        }
        setAvailableFields(all);
      } else if (selectedFarmId) {
        try {
          const res = await fieldsApi.listByFarm(selectedFarmId);
          setAvailableFields(res?.data?.fields || []);
        } catch {
          setAvailableFields([]);
        }
      }
    };
    loadFields();
  }, [selectedFarmId, farms]);

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (selectedFarmId) params.farmId = selectedFarmId;
      if (statusFilter) params.status = statusFilter;

      const res = await cropsApi.listCycles(params);
      setCycles(res?.data?.cropCycles || []);
      setMeta(res?.meta || { page: 1, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load crop cycles.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedFarmId, statusFilter]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const handleOpenCreate = () => {
    setEditingCycle(null);
    setFormData({
      fieldId: availableFields[0]?.id || '',
      cropId: catalogCrops[0]?.id || '',
      season: 'Rabi 2026-27',
      plantingDate: new Date().toISOString().split('T')[0],
      expectedHarvestDate: '',
      areaCultivated: availableFields[0]?.area ? String(availableFields[0].area) : '',
      areaUnit: 'acre',
      expectedYield: '',
      yieldUnit: 'quintal',
      expectedSellingPricePerUnit: '',
      growthStage: 'preparation',
      healthStatus: 'healthy',
      status: 'active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      fieldId: cycle.fieldId,
      cropId: cycle.cropId,
      season: cycle.season || '',
      plantingDate: cycle.plantingDate ? new Date(cycle.plantingDate).toISOString().split('T')[0] : '',
      expectedHarvestDate: cycle.expectedHarvestDate ? new Date(cycle.expectedHarvestDate).toISOString().split('T')[0] : '',
      areaCultivated: cycle.areaCultivated || '',
      areaUnit: cycle.areaUnit || 'acre',
      expectedYield: cycle.expectedYield || '',
      yieldUnit: cycle.yieldUnit || 'quintal',
      expectedSellingPricePerUnit: cycle.expectedSellingPricePerUnit || '',
      growthStage: cycle.growthStage || 'vegetative',
      healthStatus: cycle.healthStatus || 'healthy',
      status: cycle.status || 'active',
      notes: cycle.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        season: formData.season || undefined,
        plantingDate: formData.plantingDate ? new Date(formData.plantingDate) : undefined,
        expectedHarvestDate: formData.expectedHarvestDate ? new Date(formData.expectedHarvestDate) : undefined,
        areaCultivated: Number(formData.areaCultivated),
        areaUnit: formData.areaUnit || 'acre',
        expectedYield: formData.expectedYield !== '' ? Number(formData.expectedYield) : undefined,
        yieldUnit: formData.yieldUnit || 'quintal',
        expectedSellingPricePerUnit: formData.expectedSellingPricePerUnit !== '' ? Number(formData.expectedSellingPricePerUnit) : undefined,
        growthStage: formData.growthStage,
        healthStatus: formData.healthStatus,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };

      if (editingCycle) {
        await cropsApi.updateCycle(editingCycle.id, payload);
        success('Crop cycle updated successfully!');
      } else {
        await cropsApi.createCycle({
          ...payload,
          fieldId: formData.fieldId,
          cropId: formData.cropId,
        });
        success('New crop cycle initiated!');
      }
      setIsModalOpen(false);
      fetchCycles();
    } catch (err) {
      toastError(err.message || 'Failed to save crop cycle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCycle) return;
    setDeleteLoading(true);
    try {
      await cropsApi.deleteCycle(deletingCycle.id);
      success('Crop cycle deleted.');
      setDeletingCycle(null);
      fetchCycles();
    } catch (err) {
      toastError(err.message || 'Failed to delete crop cycle.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Cultivation Cycles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track active sowings, growth stages, crop progress, and expected yield
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Start New Crop Cycle
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            !statusFilter ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Cycles
        </button>
        {CROP_CYCLE_STATUSES.map((st) => (
          <button
            key={st.value}
            onClick={() => { setStatusFilter(st.value); setPage(1); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              statusFilter === st.value ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchCycles} />}

      {loading ? (
        <LoadingSpinner text="Loading crop cycles..." />
      ) : cycles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cycles.map((cycle) => {
            const metrics = cycle.metrics || {};
            const cropName = cycle.crop?.name || 'Crop';
            const fieldName = cycle.field?.name || 'Field';
            const farmName = cycle.field?.farm?.name || '';

            return (
              <div
                key={cycle.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={cycle.status}>{cycle.status}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cycle)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        title="Edit cycle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCycle(cycle)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete cycle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Crop & Field Details */}
                  <h3 className="text-base font-extrabold text-slate-900">{cropName}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-700">{fieldName}</span>
                    {farmName && <span>• {farmName}</span>}
                  </div>

                  {/* Progress & Health */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Crop Progress:</span>
                      <span className="font-extrabold text-emerald-700">
                        {metrics.cropProgressPercentage ?? 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${metrics.cropProgressPercentage ?? 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-500">Stage: <span className="font-semibold capitalize text-slate-700">{cycle.growthStage}</span></span>
                      <Badge variant={cycle.healthStatus} className="text-[10px]">
                        {cycle.healthStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Financial & Harvest Projections */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Area</span>
                      <span className="font-black text-slate-900">{formatArea(cycle.areaCultivated, cycle.areaUnit)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Exp. Yield</span>
                      <span className="font-black text-slate-900">{formatYield(cycle.expectedYield, cycle.yieldUnit)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Est. Revenue</span>
                      <span className="font-black text-slate-900">{formatCurrency(metrics.estimatedRevenue)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Expenses</span>
                      <span className="font-black text-rose-600">{formatCurrency(metrics.totalAttributableExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with dates */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sown: {formatDate(cycle.plantingDate)}</span>
                  </div>
                  <div>
                    <span>Harvest: {formatDate(cycle.actualHarvestDate || cycle.expectedHarvestDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sprout}
          title="No cultivation cycles found"
          description="Initiate your first crop cycle on a field to plan sowing, track growth progress, and calculate harvest yields."
          actionText="Start New Cycle"
          onAction={handleOpenCreate}
        />
      )}

      {/* Pagination */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={(p) => setPage(p)}
      />

      {/* Create / Edit Cycle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCycle ? 'Update Cultivation Cycle' : 'Initiate New Crop Cycle'}
        subtitle="Specify field, crop variety, planting schedule, and projections"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingCycle && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Target Field"
                required
                options={availableFields.map((f) => ({
                  value: f.id,
                  label: `${f.name} (${f.area} ${f.areaUnit}${f.farmName ? ` - ${f.farmName}` : ''})`,
                }))}
                value={formData.fieldId}
                onChange={(e) => {
                  const selField = availableFields.find((f) => f.id === e.target.value);
                  setFormData({
                    ...formData,
                    fieldId: e.target.value,
                    areaCultivated: selField?.area ? String(selField.area) : formData.areaCultivated,
                  });
                }}
              />
              <Select
                label="Crop Variety"
                required
                options={catalogCrops.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.category || 'Crop'})`,
                }))}
                value={formData.cropId}
                onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Cultivation Season"
              placeholder="e.g. Rabi 2026-27"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
            />
            <Input
              label="Planting Date"
              type="date"
              value={formData.plantingDate}
              onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
            />
            <Input
              label="Expected Harvest"
              type="date"
              value={formData.expectedHarvestDate}
              onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Cultivated Area"
              required
              type="number"
              step="0.01"
              placeholder="3.0"
              value={formData.areaCultivated}
              onChange={(e) => setFormData({ ...formData, areaCultivated: e.target.value })}
            />
            <Select
              label="Area Unit"
              options={[
                { value: 'acre', label: 'Acres' },
                { value: 'hectare', label: 'Hectares' },
              ]}
              value={formData.areaUnit}
              onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
            />
            <Input
              label="Exp. Yield"
              type="number"
              step="0.01"
              placeholder="Auto-calc"
              helperText="Optional (auto-derived)"
              value={formData.expectedYield}
              onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })}
            />
            <Input
              label="Exp. Price/Unit"
              type="number"
              step="1"
              placeholder="₹ 2000"
              value={formData.expectedSellingPricePerUnit}
              onChange={(e) => setFormData({ ...formData, expectedSellingPricePerUnit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Growth Stage"
              options={GROWTH_STAGES}
              value={formData.growthStage}
              onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
            />
            <Select
              label="Crop Health"
              options={CROP_HEALTH_STATUSES}
              value={formData.healthStatus}
              onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
            />
            <Select
              label="Cycle Status"
              options={CROP_CYCLE_STATUSES}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cycle Notes & Sowing Log
            </label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Seed treatment, fertilizer schedule, germination rate..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingCycle ? 'Save Changes' : 'Start Cycle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCycle)}
        onClose={() => setDeletingCycle(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Crop Cycle?"
        message="Are you sure you want to delete this crop cycle? Its tasks, expenses, and harvests will also be deleted."
      />
    </div>
  );
};

export default CropCyclesList;
