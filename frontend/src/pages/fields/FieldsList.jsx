import React, { useState, useEffect, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext.jsx';
import { fieldsApi } from '../../api/fields.api.js';
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
  Layers,
  Droplets,
  Edit2,
  Trash2,
  Sprout,
  Tractor,
} from 'lucide-react';

export const FieldsList = () => {
  const { farms, selectedFarmId, selectFarm } = useFarm();
  const { success, error: toastError } = useToast();

  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active farm for this page
  const currentFarmId = selectedFarmId || (farms.length > 0 ? farms[0].id : '');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    farmId: currentFarmId,
    name: '',
    area: '',
    areaUnit: 'acre',
    soilType: '',
    irrigationType: '',
    notes: '',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingField, setDeletingField] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleOpenCreate = () => {
    setEditingField(null);
    setFormData({
      farmId: currentFarmId,
      name: '',
      area: '',
      areaUnit: 'acre',
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
      areaUnit: field.areaUnit || 'acre',
      soilType: field.soilType || '',
      irrigationType: field.irrigationType || '',
      notes: field.notes || '',
      status: field.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        area: Number(formData.area),
        areaUnit: formData.areaUnit || 'acre',
        soilType: formData.soilType.trim() || undefined,
        irrigationType: formData.irrigationType.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
      };

      if (editingField) {
        await fieldsApi.update(editingField.id, payload);
        success('Field updated successfully!');
      } else {
        const targetFarmId = formData.farmId || currentFarmId;
        await fieldsApi.createOnFarm(targetFarmId, payload);
        success('New field created successfully!');
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

  const activeFarm = farms.find((f) => f.id === currentFarmId);

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
        <Button onClick={handleOpenCreate} icon={Plus} disabled={!currentFarmId}>
          Add New Field
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

                {/* Active Cycle Badge */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {activeCycle ? (
                    <>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5" />
                        {activeCycle.crop?.name || 'Crop Cycle'}
                      </span>
                      <Badge variant="active">{activeCycle.growthStage}</Badge>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">No crop cycle planted</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Grid3X3}
          title={`No fields found in "${activeFarm?.name || 'this farm'}"`}
          description="Partition this farm holding into plots to schedule planting and irrigation."
          actionText="Add Field Parcel"
          onAction={handleOpenCreate}
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingField ? 'Edit Field' : 'Create New Field'}
        subtitle={`Holding: ${activeFarm?.name || 'Selected Farm'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Field Name"
            required
            placeholder="e.g. North Plot / Orchard Bed"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Area"
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="3.0"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
            <Select
              label="Area Unit"
              options={[
                { value: 'acre', label: 'Acres' },
                { value: 'hectare', label: 'Hectares' },
                { value: 'bigha', label: 'Bigha' },
                { value: 'guntha', label: 'Guntha' },
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
            <Button type="submit" variant="primary" loading={submitting}>
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
