/**
 * Enum constants and color mappings strictly aligned with AgriFarm PostgreSQL DBML schema
 */

export const CROP_CYCLE_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const GROWTH_STAGES = [
  { value: 'preparation', label: 'Land Preparation' },
  { value: 'sowing', label: 'Sowing / Transplanting' },
  { value: 'germination', label: 'Germination' },
  { value: 'vegetative', label: 'Vegetative Growth' },
  { value: 'flowering', label: 'Flowering' },
  { value: 'fruiting', label: 'Fruiting / Grain Filling' },
  { value: 'maturity', label: 'Maturity' },
  { value: 'harvested', label: 'Harvested' },
];

export const CROP_HEALTH_STATUSES = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'needs_attention', label: 'Needs Attention' },
  { value: 'affected', label: 'Pest/Disease Affected' },
  { value: 'unknown', label: 'Unknown' },
];

export const TASK_TYPES = [
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'fertilization', label: 'Fertilization' },
  { value: 'pesticide', label: 'Pest & Disease Control' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'planting', label: 'Planting / Sowing' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'inspection', label: 'Field Inspection' },
  { value: 'other', label: 'Other Activity' },
];

export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'seeds', label: 'Seeds & Seedlings' },
  { value: 'fertilizer', label: 'Fertilizers & Nutrients' },
  { value: 'pesticide', label: 'Crop Protection & Pesticides' },
  { value: 'labour', label: 'Farm Labour' },
  { value: 'irrigation', label: 'Water & Electricity' },
  { value: 'equipment', label: 'Machinery & Fuel' },
  { value: 'transportation', label: 'Transport & Logistics' },
  { value: 'maintenance', label: 'Repairs & Maintenance' },
  { value: 'other', label: 'Other Expenses' },
];

export const STATUS_COLORS = {
  // General & Lifecycle
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-700 border-slate-200',
  archived: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  planned: 'bg-blue-50 text-blue-700 border-blue-200',
  harvested: 'bg-purple-50 text-purple-700 border-purple-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',

  // Task Statuses
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Health
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  needs_attention: 'bg-amber-50 text-amber-700 border-amber-200',
  affected: 'bg-rose-50 text-rose-700 border-rose-200',
  unknown: 'bg-slate-100 text-slate-600 border-slate-200',

  // Priority
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-rose-50 text-rose-700 border-rose-200',
};
