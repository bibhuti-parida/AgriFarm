import React, { useState, useEffect, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { tasksApi } from '../../api/tasks.api.js';
import { fieldsApi } from '../../api/fields.api.js';
import { cropsApi } from '../../api/crops.api.js';
import { usersApi } from '../../api/users.api.js';
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
import { formatDate } from '../../utils/formatters.js';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  User, 
  Filter,
  Check,
  MapPin,
  Sprout
} from 'lucide-react';

export default function TasksList() {
  const { currentFarm, farms } = useFarm();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals & Selection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  // Form dependencies (fields, cycles, users)
  const [farmFields, setFarmFields] = useState([]);
  const [farmCycles, setFarmCycles] = useState([]);
  const [users, setUsers] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    farmId: '',
    fieldId: '',
    cropCycleId: '',
    title: '',
    description: '',
    type: 'irrigation',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Update selected farm filter when active farm context changes
  useEffect(() => {
    if (currentFarm?.id) {
      setSelectedFarmId(currentFarm.id);
    }
  }, [currentFarm]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (selectedFarmId) params.farmId = selectedFarmId;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await tasksApi.list(params);
      setTasks(res.data?.tasks || []);
      setMeta(res.meta || { page: 1, limit: 15, total: res.data?.tasks?.length || 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [page, selectedFarmId, statusFilter, priorityFilter, typeFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Load team users for assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await usersApi.list();
        setUsers(res.data?.users || []);
      } catch (e) {
        // Fallback gracefully
        console.warn('Could not load users list', e);
      }
    };
    loadUsers();
  }, []);

  // When opening modal or selecting farm in form, load that farm's fields and active cycles
  const loadFarmDependencies = async (farmId) => {
    if (!farmId) {
      setFarmFields([]);
      setFarmCycles([]);
      return;
    }
    try {
      const [fRes, cRes] = await Promise.all([
        fieldsApi.listByFarm(farmId),
        cropsApi.listCycles({ farmId, status: 'active' })
      ]);
      setFarmFields(fRes.data?.fields || []);
      setFarmCycles(cRes.data?.cropCycles || []);
    } catch (e) {
      console.warn('Error fetching farm dependencies', e);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultFarm = selectedFarmId || currentFarm?.id || (farms[0]?.id || '');
    setEditingTask(null);
    setFormData({
      farmId: defaultFarm,
      fieldId: '',
      cropCycleId: '',
      title: '',
      description: '',
      type: 'irrigation',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
    });
    setFormErrors({});
    if (defaultFarm) loadFarmDependencies(defaultFarm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      farmId: task.farmId,
      fieldId: task.fieldId || '',
      cropCycleId: task.cropCycleId || '',
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      assignedTo: task.assignedTo || '',
    });
    setFormErrors({});
    loadFarmDependencies(task.farmId);
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
    if (!formData.title?.trim()) errs.title = 'Task title is required';
    if (!formData.farmId) errs.farmId = 'Farm is required';
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
        assignedTo: formData.assignedTo || null,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      };

      if (editingTask) {
        await tasksApi.update(editingTask.id, payload);
        showToast('Task updated successfully', 'success');
      } else {
        await tasksApi.create(payload);
        showToast('Task created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (task) => {
    setCompletingTaskId(task.id);
    try {
      await tasksApi.complete(task.id);
      showToast('Task marked as completed', 'success');
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to update task completion status', 'error');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirmId) return;
    try {
      await tasksApi.delete(deleteConfirmId);
      showToast('Task deleted successfully', 'success');
      setDeleteConfirmId(null);
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Quick stats summary calculations
  const totalTasksCount = meta.total || tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckSquare className="w-5 h-5" />
            </div>
            Agricultural Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize, schedule, and assign daily farm activities, irrigation, and field work.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
          New Task
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalTasksCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed (Page)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Completion Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Task Type</label>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Types' },
              { value: 'irrigation', label: 'Irrigation' },
              { value: 'fertilization', label: 'Fertilization' },
              { value: 'pesticide', label: 'Pesticide' },
              { value: 'weeding', label: 'Weeding' },
              { value: 'planting', label: 'Planting' },
              { value: 'harvesting', label: 'Harvesting' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>
      </div>

      {/* Tasks Table / List */}
      {loading ? (
        <LoadingSpinner message="Loading agricultural tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Schedule a new farm task or clear your search filters."
          actionText="Create First Task"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Done</th>
                  <th className="py-3.5 px-4">Task</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      task.status === 'completed' ? 'bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        disabled={completingTaskId === task.id || task.status === 'completed'}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          task.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white cursor-default'
                            : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent'
                        }`}
                        title={task.status === 'completed' ? 'Completed' : 'Click to Mark Complete'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className={`font-semibold text-slate-900 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                          {task.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {task.farm?.name || 'Farm'}
                      </div>
                      {task.field && (
                        <div className="text-slate-500 pl-4 text-[11px]">
                          Field: {task.field.name}
                        </div>
                      )}
                      {task.cropCycle && (
                        <div className="text-emerald-600 pl-4 text-[11px] font-medium flex items-center gap-0.5">
                          <Sprout className="w-2.5 h-2.5" />
                          {task.cropCycle.crop?.name || 'Cycle'}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-slate-700 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                        {task.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={task.priority} />
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {task.dueDate ? (
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">No due date</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={task.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(task.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Task"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Schedule New Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Task Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Drip irrigation check & nitrogen fertigation"
            error={formErrors.title}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Field Parcel (Optional)</label>
              <Select
                value={formData.fieldId}
                onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                options={[
                  { value: '', label: '-- None (Entire Farm) --' },
                  ...farmFields.map((f) => ({ value: f.id, label: `${f.name} (${f.area} ${f.areaUnit})` })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Active Cycle (Optional)</label>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'irrigation', label: 'Irrigation' },
                  { value: 'fertilization', label: 'Fertilization' },
                  { value: 'pesticide', label: 'Pesticide Application' },
                  { value: 'weeding', label: 'Weeding' },
                  { value: 'planting', label: 'Planting / Sowing' },
                  { value: 'harvesting', label: 'Harvesting' },
                  { value: 'inspection', label: 'Field Inspection' },
                  { value: 'other', label: 'Other Activity' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
            <Select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              options={[
                { value: '', label: '-- Unassigned --' },
                ...users.map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Instructions, chemicals dosage, or notes for the field worker..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this agricultural task? This action cannot be undone."
      />
    </div>
  );
}
