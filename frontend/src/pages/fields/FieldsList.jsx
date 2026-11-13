import React, { useState, useEffect, useCallback } from 'react';
import { fieldsApi } from '../../api/fields.api.js';
import { useFarm } from '../../context/FarmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatArea } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ErrorAlert } from '../../components/common/ErrorAlert.jsx';
import {
  Grid3X3,
  Plus,
  Edit2,
  Trash2,
  Tractor,
  Layers,
  Droplets,
  Sprout,
  Calendar,
  PieChart as PieChartIcon,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const FieldsList = () => {
  const { farms, selectedFarmId, selectFarm } = useFarm();
  const { success, error: toastError } = useToast();

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected farm context
  const currentFarmId = selectedFarmId || farms[0]?.id || '';
  const activeFarm = farms.find((f) => f.id === currentFarmId);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingField, setDeletingField] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    farmId: '',
    name: '',
    area: '',
    areaUnit: 'acre',
    soilType: '',
    irrigationType: '',
    notes: '',
    status: 'active',
  });

  const fetchFields = useCallback(async () => {
    if (!currentFarmId) {
      setFields([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fieldsApi.listByFarm(currentFarmId);
      setFields(res?.data?.fields || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch fields.');
    } finally {
      setLoading(false);
    }
  }, [currentFarmId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // Capacity calculations for the active farm
  const farmTotalArea = Number(activeFarm?.totalArea || 0);
  const farmAreaUnit = activeFarm?.areaUnit || 'acre';
  const totalAllocated = fields.reduce((sum, f) => sum + (Number(f.area) || 0), 0);
  const remainingCapacity = Math.max(0, farmTotalArea - totalAllocated);
  const allocationPercentage = farmTotalArea > 0 ? Math.min(100, (totalAllocated / farmTotalArea) * 100) : 0;
  const isAtFullCapacity = remainingCapacity <= 0.001;

  // Maximum allowed for the field currently being added or edited
  const maxAllowedForModal = editingField
    ? remainingCapacity + Number(editingField.area || 0)
    : remainingCapacity;

  const handleOpenCreate = () => {
    setEditingField(null);
    setFormData({
      farmId: currentFarmId,
      name: '',
      area: remainingCapacity > 0 ? String(remainingCapacity) : '',
      areaUnit: farmAreaUnit,
      soilType: '',
      irrigationType: '',
      notes: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (field) => {
    setEditingField(field);
    setFormData({
      farmId: field.farmId || currentFarmId,
      name: field.name || '',
      area: field.area || '',
      areaUnit: field.areaUnit || farmAreaUnit,
      soilType: field.soilType || '',
      irrigationType: field.irrigationType || '',
      notes: field.notes || '',
      status: field.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredArea = Number(formData.area);

    if (!enteredArea || enteredArea <= 0) {
      toastError('Please enter a valid positive field area.');
      return;
    }

    if (enteredArea > maxAllowedForModal + 0.001) {
      toastError(
        `Field area (${enteredArea} ${formData.areaUnit}) exceeds farm capacity. Maximum allowed: ${maxAllowedForModal.toFixed(2)} ${farmAreaUnit}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        area: enteredArea,
        areaUnit: formData.areaUnit || 'acre',
        soilType: formData.soilType.trim() || undefined,
        irrigationType: formData.irrigationType.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
      };

      if (editingField) {
        await fieldsApi.update(editingField.id, payload);
        success('Field parcel updated successfully!');
      } else {
        const targetFarmId = formData.farmId || currentFarmId;
        await fieldsApi.createOnFarm(targetFarmId, payload);
        success('New field created successfully within farm capacity!');
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (err) {
      toastError(err.message || 'Failed to save field details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingField) return;
    setDeleteLoading(true);
    try {
      await fieldsApi.delete(deletingField.id);
      success(`Field "${deletingField.name}" deleted.`);
      setDeletingField(null);
      fetchFields();
    } catch (err) {
      toastError(err.message || 'Failed to delete field.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Agricultural Fields
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Individual plot partitions, soil attributes, and irrigation infrastructure
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          icon={Plus}
          disabled={!currentFarmId || isAtFullCapacity}
          title={isAtFullCapacity ? 'Farm is at full capacity' : 'Add new field'}
        >
          {isAtFullCapacity ? 'Capacity Reached' : 'Add New Field'}
        </Button>
      </div>

      {/* Farm Switcher for Fields View */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Tractor className="w-4 h-4 text-emerald-600" />
          <span>Active Farm Scope:</span>
        </div>
        <div className="w-full sm:w-72">
          <Select
            placeholder="Select a farm..."
            options={farms.map((f) => ({ value: f.id, label: `${f.name} (${f.totalArea} ${f.areaUnit})` }))}
            value={currentFarmId}
            onChange={(e) => selectFarm(e.target.value)}
          />
        </div>
      </div>

      {/* Land Allocation & Capacity Bar for Active Farm */}
      {activeFarm && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {activeFarm.name} — Capacity & Allocation
              </h3>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">{totalAllocated.toFixed(2)}</span> of{' '}
              <span className="font-bold text-slate-900">{farmTotalArea.toFixed(2)} {farmAreaUnit}</span> allocated ({allocationPercentage.toFixed(1)}%)
            </div>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                isAtFullCapacity
                  ? 'bg-rose-500'
                  : allocationPercentage > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${allocationPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Total Farm Capacity</span>
              <span className="text-sm font-extrabold text-slate-800">
                {farmTotalArea.toFixed(2)} {farmAreaUnit}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Allocated to Fields</span>
              <span className="text-sm font-extrabold text-emerald-700">
                {totalAllocated.toFixed(2)} {farmAreaUnit}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Remaining Available</span>
              <span
                className={`text-sm font-extrabold flex items-center gap-1 ${
                  isAtFullCapacity ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {remainingCapacity.toFixed(2)} {farmAreaUnit}
                {isAtFullCapacity && (
                  <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">
                    100% Full
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchFields} />}

      {loading ? (
        <LoadingSpinner text="Loading fields for active farm..." />
      ) : !currentFarmId ? (
        <EmptyState
          icon={Tractor}
          title="No farm selected"
          description="Please register or select a farm to manage its agricultural fields."
        />
      ) : fields.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fields.map((field) => {
            const activeCycle = field.cropCycles?.[0];
            return (
              <div
                key={field.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={field.status}>{field.status}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(field)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        title="Edit field"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingField(field)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{field.name}</h3>
                  <div className="text-lg font-black text-emerald-700 mt-1">
                    {formatArea(field.area, field.areaUnit)}
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Soil: {field.soilType || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>Irrigation: {field.irrigationType || 'Not specified'}</span>
                    </div>
                  </div>

                  {field.notes && (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {field.notes}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {activeCycle ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                      <Sprout className="w-3.5 h-3.5" />
                      <span>{activeCycle.crop?.name}</span>
                      <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-emerald-800">
                        {activeCycle.growthStage}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No active crop cycle</span>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(field.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Grid3X3}
          title="No fields found"
          description={`Start by partitioning ${activeFarm?.name || 'your farm'} into agricultural field plots.`}
          actionText={isAtFullCapacity ? undefined : "Create First Field"}
          onAction={isAtFullCapacity ? undefined : handleOpenCreate}
        />
      )}

      {/* Create / Edit Field Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingField ? 'Edit Field Parcel' : 'Add New Field'}
        subtitle={
          editingField
            ? `Modify attributes for ${editingField.name}`
            : `Partition new plot under ${activeFarm?.name || 'farm'}`
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Capacity Alert Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              maxAllowedForModal <= 0.001
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
            }`}
          >
            {maxAllowedForModal <= 0.001 ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold">Farm Capacity Limit: </span>
              Total {farmTotalArea.toFixed(2)} {farmAreaUnit}. Currently allocated:{' '}
              {totalAllocated.toFixed(2)} {farmAreaUnit}.{' '}
              <strong className="underline">
                Maximum {maxAllowedForModal.toFixed(2)} {farmAreaUnit} allowed
              </strong>{' '}
              for this field.
            </div>
          </div>

          <Input
            label="Field Name"
            required
            placeholder="e.g. Plot A, Mango Orchard, Canal Side"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Area"
                required
                type="number"
                step="0.01"
                min="0.01"
                max={maxAllowedForModal > 0 ? maxAllowedForModal : undefined}
                placeholder={maxAllowedForModal > 0 ? `Max ${maxAllowedForModal.toFixed(2)}` : '0.00'}
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
              {Number(formData.area) > maxAllowedForModal + 0.001 && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                  Exceeds allowed capacity ({maxAllowedForModal.toFixed(2)} {farmAreaUnit} max)
                </p>
              )}
            </div>

            <Select
              label="Area Unit"
              options={[
                { value: farmAreaUnit, label: farmAreaUnit.charAt(0).toUpperCase() + farmAreaUnit.slice(1) },
                { value: 'acre', label: 'Acres' },
                { value: 'hectare', label: 'Hectares' },
              ]}
              value={formData.areaUnit}
              onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Soil Type"
              placeholder="e.g. Black cotton, Sandy loam"
              value={formData.soilType}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
            />
            <Input
              label="Irrigation Type"
              placeholder="e.g. Drip, Canal, Sprinkler"
              value={formData.irrigationType}
              onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
            />
          </div>

          <Select
            label="Field Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Field Notes
            </label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Drainage, slopes, solar exposure..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={maxAllowedForModal <= 0.001 || Number(formData.area) > maxAllowedForModal + 0.001}
            >
              {editingField ? 'Save Changes' : 'Create Field'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingField)}
        onClose={() => setDeletingField(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title={`Delete field "${deletingField?.name}"?`}
        message="Are you sure you want to delete this field? All linked cycles, tasks, expenses, and harvests will also be affected."
      />
    </div>
  );
};

export default FieldsList;
