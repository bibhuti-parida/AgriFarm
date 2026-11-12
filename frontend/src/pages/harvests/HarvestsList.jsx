import React, { useState, useEffect, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { harvestsApi } from '../../api/harvests.api.js';
import { cropsApi } from '../../api/crops.api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { 
  Wheat, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit3, 
  MapPin, 
  Sprout, 
  Scale, 
  IndianRupee, 
  UserCheck 
} from 'lucide-react';

export default function HarvestsList() {
  const { currentFarm, farms } = useFarm();
  const { showToast } = useToast();

  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals & confirmation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Crop cycles available for recording a harvest
  const [availableCycles, setAvailableCycles] = useState([]);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    farmId: '',
    cropCycleId: '',
    quantity: '',
    quantityUnit: 'quintal',
    harvestedOn: new Date().toISOString().slice(0, 10),
    grade: '',
    sellingPricePerUnit: '',
    buyer: '',
    notes: '',
    markCycleHarvested: true,
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    quantity: '',
    quantityUnit: 'quintal',
    harvestedOn: '',
    grade: '',
    sellingPricePerUnit: '',
    buyer: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentFarm?.id) {
      setSelectedFarmId(currentFarm.id);
    }
  }, [currentFarm]);

  const fetchHarvests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (selectedFarmId) params.farmId = selectedFarmId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await harvestsApi.listAll(params);
      setHarvests(res.data?.harvests || []);
      setMeta(res.meta || { page: 1, limit: 15, total: res.data?.harvests?.length || 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch harvests');
    } finally {
      setLoading(false);
    }
  }, [page, selectedFarmId, startDate, endDate]);

  useEffect(() => {
    fetchHarvests();
  }, [fetchHarvests]);

  // Load active crop cycles when selecting a farm in create modal
  const loadCyclesForFarm = async (farmId) => {
    if (!farmId) {
      setAvailableCycles([]);
      return;
    }
    try {
      const res = await cropsApi.listCycles({ farmId });
      // Filter active or planned cycles
      setAvailableCycles(res.data?.cropCycles || []);
    } catch (e) {
      console.warn('Error loading cycles for farm', e);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultFarm = selectedFarmId || currentFarm?.id || (farms[0]?.id || '');
    setCreateForm({
      farmId: defaultFarm,
      cropCycleId: '',
      quantity: '',
      quantityUnit: 'quintal',
      harvestedOn: new Date().toISOString().slice(0, 10),
      grade: 'Grade A',
      sellingPricePerUnit: '',
      buyer: '',
      notes: '',
      markCycleHarvested: true,
    });
    setFormErrors({});
    if (defaultFarm) loadCyclesForFarm(defaultFarm);
    setIsCreateModalOpen(true);
  };

  const handleFarmChangeInCreate = (newFarmId) => {
    setCreateForm((prev) => ({
      ...prev,
      farmId: newFarmId,
      cropCycleId: '',
    }));
    loadCyclesForFarm(newFarmId);
  };

  const handleCropCycleSelect = (cycleId) => {
    const selected = availableCycles.find((c) => c.id === cycleId);
    setCreateForm((prev) => ({
      ...prev,
      cropCycleId: cycleId,
      quantityUnit: selected?.yieldUnit || selected?.crop?.yieldUnit || 'quintal',
      sellingPricePerUnit: selected?.expectedSellingPricePerUnit ? String(selected.expectedSellingPricePerUnit) : '',
    }));
  };

  const handleOpenEditModal = (harvest) => {
    setEditingHarvest(harvest);
    setEditForm({
      quantity: String(harvest.quantity),
      quantityUnit: harvest.quantityUnit,
      harvestedOn: harvest.harvestedOn ? new Date(harvest.harvestedOn).toISOString().slice(0, 10) : '',
      grade: harvest.grade || '',
      sellingPricePerUnit: harvest.sellingPricePerUnit ? String(harvest.sellingPricePerUnit) : '',
      buyer: harvest.buyer || '',
      notes: harvest.notes || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!createForm.cropCycleId) errs.cropCycleId = 'Please select a crop cycle to record harvest';
    if (!createForm.quantity || Number(createForm.quantity) <= 0) errs.quantity = 'Quantity must be positive';
    if (!createForm.quantityUnit?.trim()) errs.quantityUnit = 'Unit is required';
    if (!createForm.harvestedOn) errs.harvestedOn = 'Harvest date is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        quantity: Number(createForm.quantity),
        quantityUnit: createForm.quantityUnit.trim(),
        harvestedOn: new Date(createForm.harvestedOn).toISOString(),
        grade: createForm.grade?.trim() || undefined,
        sellingPricePerUnit: createForm.sellingPricePerUnit ? Number(createForm.sellingPricePerUnit) : undefined,
        currency: 'INR',
        buyer: createForm.buyer?.trim() || undefined,
        notes: createForm.notes?.trim() || undefined,
        markCycleHarvested: Boolean(createForm.markCycleHarvested),
      };

      await harvestsApi.createForCycle(createForm.cropCycleId, payload);
      showToast('Harvest recorded successfully', 'success');
      setIsCreateModalOpen(false);
      fetchHarvests();
    } catch (err) {
      showToast(err.message || 'Failed to record harvest', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingHarvest) return;

    const errs = {};
    if (!editForm.quantity || Number(editForm.quantity) <= 0) errs.quantity = 'Quantity must be positive';
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        quantity: Number(editForm.quantity),
        quantityUnit: editForm.quantityUnit.trim(),
        harvestedOn: editForm.harvestedOn ? new Date(editForm.harvestedOn).toISOString() : undefined,
        grade: editForm.grade?.trim() || null,
        sellingPricePerUnit: editForm.sellingPricePerUnit ? Number(editForm.sellingPricePerUnit) : null,
        buyer: editForm.buyer?.trim() || null,
        notes: editForm.notes?.trim() || null,
      };

      await harvestsApi.update(editingHarvest.id, payload);
      showToast('Harvest updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchHarvests();
    } catch (err) {
      showToast(err.message || 'Failed to update harvest', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHarvest = async () => {
    if (!deleteConfirmId) return;
    try {
      await harvestsApi.delete(deleteConfirmId);
      showToast('Harvest record deleted', 'success');
      setDeleteConfirmId(null);
      fetchHarvests();
    } catch (err) {
      showToast(err.message || 'Failed to delete harvest', 'error');
    }
  };

  // Summaries
  const pageTotalRevenue = harvests.reduce((acc, curr) => {
    const qty = Number(curr.quantity) || 0;
    const price = Number(curr.sellingPricePerUnit) || 0;
    return acc + qty * price;
  }, 0);

  const totalQuantitySum = harvests.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Wheat className="w-5 h-5" />
            </div>
            Harvest Records
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Log crop yield outputs, grain quality grades, realized market prices, and buyer details.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
          Record Harvest
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Page Total Revenue</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {formatCurrency(pageTotalRevenue)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quantity Harvested</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalQuantitySum.toLocaleString()} <span className="text-sm font-medium text-slate-500">Units</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Harvest Batches</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{meta.total || harvests.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wheat className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Harvests Table */}
      {loading ? (
        <LoadingSpinner message="Loading harvest records..." />
      ) : harvests.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="No harvest records found"
          description="Record a crop harvest from one of your active cycles."
          actionText="Record First Harvest"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Harvest Date</th>
                  <th className="py-3.5 px-4">Crop & Field</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Price / Unit</th>
                  <th className="py-3.5 px-4 text-right">Realized Revenue</th>
                  <th className="py-3.5 px-4">Buyer</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {harvests.map((h) => {
                  const revenue = (Number(h.quantity) || 0) * (Number(h.sellingPricePerUnit) || 0);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(h.harvestedOn)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                          {h.cropCycle?.crop?.name || 'Crop'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {h.farm?.name} {h.cropCycle?.field?.name ? `• ${h.cropCycle.field.name}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {Number(h.quantity).toLocaleString()} <span className="text-xs font-medium text-slate-500">{h.quantityUnit}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {h.grade ? (
                          <span className="text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {h.grade}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {h.sellingPricePerUnit ? formatCurrency(h.sellingPricePerUnit) : <span className="text-slate-400">Unspecified</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {revenue > 0 ? formatCurrency(revenue) : <span className="text-slate-400 text-xs">₹0</span>}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {h.buyer ? (
                          <span className="flex items-center gap-1 font-medium text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {h.buyer}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(h)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Harvest"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(h.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Harvest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Record Harvest Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Crop Harvest"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Farm *</label>
            <Select
              value={createForm.farmId}
              onChange={(e) => handleFarmChangeInCreate(e.target.value)}
              options={farms.map((f) => ({ value: f.id, label: f.name }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Cycle to Harvest *</label>
            <Select
              value={createForm.cropCycleId}
              onChange={(e) => handleCropCycleSelect(e.target.value)}
              options={[
                { value: '', label: '-- Select active crop cycle --' },
                ...availableCycles.map((c) => ({
                  value: c.id,
                  label: `${c.crop?.name || 'Crop'} - ${c.season} [Field: ${c.field?.name}] (${c.status})`,
                })),
              ]}
            />
            {formErrors.cropCycleId && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.cropCycleId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quantity Harvested *"
              type="number"
              step="0.01"
              value={createForm.quantity}
              onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
              placeholder="e.g. 24.5"
              error={formErrors.quantity}
            />

            <Input
              label="Quantity Unit *"
              value={createForm.quantityUnit}
              onChange={(e) => setCreateForm({ ...createForm, quantityUnit: e.target.value })}
              placeholder="quintal, kg, ton, crates"
              error={formErrors.quantityUnit}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Harvest Date *"
              type="date"
              value={createForm.harvestedOn}
              onChange={(e) => setCreateForm({ ...createForm, harvestedOn: e.target.value })}
              error={formErrors.harvestedOn}
            />

            <Input
              label="Grade / Quality (Optional)"
              value={createForm.grade}
              onChange={(e) => setCreateForm({ ...createForm, grade: e.target.value })}
              placeholder="Grade A / Export / Milling"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Selling Price per Unit (₹)"
              type="number"
              step="0.01"
              value={createForm.sellingPricePerUnit}
              onChange={(e) => setCreateForm({ ...createForm, sellingPricePerUnit: e.target.value })}
              placeholder="e.g. 2150.00"
            />

            <Input
              label="Buyer / Market (Optional)"
              value={createForm.buyer}
              onChange={(e) => setCreateForm({ ...createForm, buyer: e.target.value })}
              placeholder="e.g. Sambalpur Mandi APMC"
            />
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex items-center gap-3">
            <input
              type="checkbox"
              id="markCycleHarvested"
              checked={createForm.markCycleHarvested}
              onChange={(e) => setCreateForm({ ...createForm, markCycleHarvested: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="markCycleHarvested" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Mark crop cycle status as <span className="text-emerald-700 font-bold">HARVESTED</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Moisture details</label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. 12% moisture level, stored in warehouse bin B2"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Record Harvest
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Harvest Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Harvest Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quantity Harvested *"
              type="number"
              step="0.01"
              value={editForm.quantity}
              onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
              error={formErrors.quantity}
            />

            <Input
              label="Quantity Unit *"
              value={editForm.quantityUnit}
              onChange={(e) => setEditForm({ ...editForm, quantityUnit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Harvest Date *"
              type="date"
              value={editForm.harvestedOn}
              onChange={(e) => setEditForm({ ...editForm, harvestedOn: e.target.value })}
            />

            <Input
              label="Grade / Quality"
              value={editForm.grade}
              onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Selling Price per Unit (₹)"
              type="number"
              step="0.01"
              value={editForm.sellingPricePerUnit}
              onChange={(e) => setEditForm({ ...editForm, sellingPricePerUnit: e.target.value })}
            />

            <Input
              label="Buyer / Market"
              value={editForm.buyer}
              onChange={(e) => setEditForm({ ...editForm, buyer: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteHarvest}
        title="Delete Harvest Record"
        message="Are you sure you want to delete this harvest record? This will affect farm production reports."
      />
    </div>
  );
}
