import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { farmsApi } from '../../api/farms.api.js';
import { useFarm } from '../../context/FarmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatArea, formatDate } from '../../utils/formatters.js';
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
  Tractor,
  Plus,
  Search,
  MapPin,
  Edit2,
  Trash2,
  ExternalLink,
  Grid3X3,
  CheckSquare,
  Receipt,
  Wheat,
} from 'lucide-react';

export const FarmsList = () => {
  const { refreshFarms } = useFarm();
  const { success, error: toastError } = useToast();

  const [farms, setFarms] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    village: '',
    district: '',
    state: '',
    country: 'India',
    totalArea: '',
    areaUnit: 'acre',
    latitude: '',
    longitude: '',
    status: 'active',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Dialog State
  const [deletingFarm, setDeletingFarm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFarms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await farmsApi.list(params);
      setFarms(res?.data?.farms || []);
      setMeta(res?.meta || { page: 1, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch farms list.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  const handleOpenCreate = () => {
    setEditingFarm(null);
    setFormData({
      name: '',
      description: '',
      village: '',
      district: '',
      state: '',
      country: 'India',
      totalArea: '',
      areaUnit: 'acre',
      latitude: '',
      longitude: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name || '',
      description: farm.description || '',
      village: farm.village || '',
      district: farm.district || '',
      state: farm.state || '',
      country: farm.country || 'India',
      totalArea: farm.totalArea || '',
      areaUnit: farm.areaUnit || 'acre',
      latitude: farm.latitude ?? '',
      longitude: farm.longitude ?? '',
      status: farm.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        village: formData.village.trim() || undefined,
        district: formData.district.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || 'India',
        totalArea: Number(formData.totalArea),
        areaUnit: formData.areaUnit || 'acre',
        latitude: formData.latitude !== '' ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : undefined,
        status: formData.status,
      };

      if (editingFarm) {
        await farmsApi.update(editingFarm.id, payload);
        success('Farm updated successfully!');
      } else {
        await farmsApi.create(payload);
        success('New farm created successfully!');
      }
      setIsModalOpen(false);
      fetchFarms();
      refreshFarms();
    } catch (err) {
      toastError(err.message || 'Failed to save farm details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFarm) return;
    setDeleteLoading(true);
    try {
      await farmsApi.delete(deletingFarm.id);
      success(`Farm "${deletingFarm.name}" and its associated records deleted.`);
      setDeletingFarm(null);
      fetchFarms();
      refreshFarms();
    } catch (err) {
      toastError(err.message || 'Failed to delete farm.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Agricultural Farms
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your land holdings, field parcels, and geographical coordinates
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus} variant="primary">
          Add New Farm
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by farm name, village, district..."
            icon={Search}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="sm:w-48">
          <Select
            placeholder="All Statuses"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchFarms} />}

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner text="Fetching your farms..." />
      ) : farms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={farm.status}>{farm.status}</Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(farm)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit farm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingFarm(farm)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete farm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Link to={`/farms/${farm.id}`} className="block group">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {farm.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {farm.description || 'No description provided.'}
                  </p>
                </Link>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">
                    {[farm.village, farm.district, farm.state].filter(Boolean).join(', ') || 'Location unassigned'}
                  </span>
                </div>

                {/* Farm Metrics Pill Badges */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 rounded-xl p-2">
                    <span className="block text-xs font-black text-slate-800">
                      {farm._count?.fields || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Fields</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <span className="block text-xs font-black text-slate-800">
                      {farm._count?.tasks || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Tasks</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <span className="block text-xs font-black text-slate-800">
                      {farm._count?.expenses || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Exp.</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <span className="block text-xs font-black text-slate-800">
                      {farm._count?.harvests || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Harvest</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {formatArea(farm.totalArea, farm.areaUnit)}
                </span>
                <Link
                  to={`/farms/${farm.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Manage Farm <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Tractor}
          title="No farms registered yet"
          description="Register your first agricultural holding to start plotting fields, tracking cycles, and monitoring weather."
          actionText="Add New Farm"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFarm ? 'Edit Farm Holding' : 'Register New Farm'}
        subtitle="Specify total acreage and geographical location"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Farm Name"
            required
            placeholder="e.g. Green Valley Farm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Land Area"
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="12.5"
              value={formData.totalArea}
              onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Village / Town"
              placeholder="Ozar"
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
            />
            <Input
              label="District"
              placeholder="Nashik"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
            <Input
              label="State"
              placeholder="Maharashtra"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude (for Weather)"
              type="number"
              step="0.000001"
              placeholder="20.0922"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            />
            <Input
              label="Longitude (for Weather)"
              type="number"
              step="0.000001"
              placeholder="73.9402"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            />
          </div>

          <Select
            label="Operational Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Brief description of soil, water source, or primary crops..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formSubmitting}>
              {editingFarm ? 'Save Changes' : 'Create Farm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingFarm)}
        onClose={() => setDeletingFarm(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title={`Delete "${deletingFarm?.name}"?`}
        message="Are you sure you want to delete this farm? This will permanently delete all associated fields, tasks, expenses, and harvests."
      />
    </div>
  );
};

export default FarmsList;
