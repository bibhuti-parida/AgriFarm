import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { farmsApi } from '../../api/farms.api.js';
import { fieldsApi } from '../../api/fields.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatArea } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../../components/common/ErrorAlert.jsx';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Grid3X3,
  Layers,
  Droplets,
  Sprout,
  Thermometer,
  PieChart as PieChartIcon,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const FarmDetail = () => {
  const { id } = useParams();
  const { success, error: toastError } = useToast();

  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Field Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldSubmitting, setFieldSubmitting] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    area: '',
    areaUnit: 'acre',
    soilType: '',
    irrigationType: '',
    notes: '',
    status: 'active',
  });

  const fetchFarm = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await farmsApi.getById(id);
      setFarm(res?.data?.farm || null);
    } catch (err) {
      setError(err.message || 'Failed to load farm details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFarm();
  }, [fetchFarm]);

  const fields = farm?.fields || [];
  const farmTotalArea = Number(farm?.totalArea || 0);
  const farmAreaUnit = farm?.areaUnit || 'acre';

  const totalAllocatedArea = fields.reduce((sum, f) => sum + (Number(f.area) || 0), 0);
  const remainingCapacity = Math.max(0, farmTotalArea - totalAllocatedArea);
  const allocationPercentage = farmTotalArea > 0 ? Math.min(100, (totalAllocatedArea / farmTotalArea) * 100) : 0;
  const isAtFullCapacity = remainingCapacity <= 0.001;

  const handleAddFieldSubmit = async (e) => {
    e.preventDefault();
    const enteredArea = Number(fieldForm.area);

    if (!enteredArea || enteredArea <= 0) {
      toastError('Please enter a valid positive field area.');
      return;
    }

    if (enteredArea > remainingCapacity + 0.001) {
      toastError(
        `Field area (${enteredArea} ${fieldForm.areaUnit}) exceeds remaining capacity of ${remainingCapacity.toFixed(2)} ${farmAreaUnit}. Total farm capacity is ${farmTotalArea} ${farmAreaUnit}.`
      );
      return;
    }

    setFieldSubmitting(true);
    try {
      await fieldsApi.createOnFarm(id, {
        name: fieldForm.name.trim(),
        area: enteredArea,
        areaUnit: fieldForm.areaUnit || 'acre',
        soilType: fieldForm.soilType.trim() || undefined,
        irrigationType: fieldForm.irrigationType.trim() || undefined,
        notes: fieldForm.notes.trim() || undefined,
        status: fieldForm.status,
      });
      success('Field parcel created successfully within farm capacity!');
      setIsFieldModalOpen(false);
      setFieldForm({
        name: '',
        area: '',
        areaUnit: farmAreaUnit,
        soilType: '',
        irrigationType: '',
        notes: '',
        status: 'active',
      });
      fetchFarm();
    } catch (err) {
      toastError(err.message || 'Failed to create field.');
    } finally {
      setFieldSubmitting(false);
    }
  };

  if (loading && !farm) {
    return <LoadingSpinner text="Loading farm profile & fields..." />;
  }

  if (error && !farm) {
    return (
      <div className="space-y-4">
        <Link to="/farms">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Farms
          </Button>
        </Link>
        <ErrorAlert message={error} onRetry={fetchFarm} />
      </div>
    );
  }

  const recentWeather = farm?.weatherRecords?.[0] || null;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link to="/farms">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {farm.name}
          </h1>
          <p className="text-xs text-slate-500">Farm Profile & Fields Management</p>
        </div>
      </div>

      {/* Farm Overview Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={farm.status}>{farm.status}</Badge>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Total Land Capacity: {formatArea(farm.totalArea, farm.areaUnit)}
              </span>
            </div>

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {farm.description || 'No description provided for this agricultural property.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>
                  {[farm.village, farm.district, farm.state, farm.country].filter(Boolean).join(', ')}
                </span>
              </div>
              {farm.latitude && farm.longitude && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  <span>GPS: {Number(farm.latitude).toFixed(4)}°, {Number(farm.longitude).toFixed(4)}°</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Weather Snapshot if available */}
          {recentWeather && (
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 md:w-64 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Recent Weather</span>
                <Thermometer className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-emerald-950">
                  {recentWeather.temperatureC}°C
                </span>
                <p className="text-xs text-emerald-700 capitalize mt-0.5">{recentWeather.condition || 'Clear'}</p>
              </div>
              <div className="text-[11px] text-emerald-800">
                Humidity: {recentWeather.humidityPercent}% • Wind: {recentWeather.windSpeed} km/h
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Farm Land Capacity & Allocation Progress Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Land Allocation & Capacity</h3>
          </div>
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-900">{totalAllocatedArea.toFixed(2)}</span> of{' '}
            <span className="font-bold text-slate-900">{farmTotalArea.toFixed(2)} {farmAreaUnit}</span> allocated ({allocationPercentage.toFixed(1)}%)
          </div>
        </div>

        {/* Progress Bar */}
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
              {totalAllocatedArea.toFixed(2)} {farmAreaUnit}
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

      {/* Fields Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Field Parcels ({fields.length})
            </h2>
            <p className="text-xs text-slate-500">Configured plots and active crop cycles on this farm</p>
          </div>
          <Button
            onClick={() => {
              setFieldForm((prev) => ({
                ...prev,
                area: remainingCapacity > 0 ? String(remainingCapacity) : '',
                areaUnit: farmAreaUnit,
              }));
              setIsFieldModalOpen(true);
            }}
            icon={Plus}
            size="sm"
            disabled={isAtFullCapacity}
            title={isAtFullCapacity ? 'Farm is at full capacity' : 'Add field parcel'}
          >
            {isAtFullCapacity ? 'Capacity Reached' : 'Add Field'}
          </Button>
        </div>

        {fields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => {
              const activeCycles = field.cropCycles || [];
              return (
                <div
                  key={field.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={field.status}>{field.status}</Badge>
                      <span className="text-xs font-bold text-slate-900">
                        {formatArea(field.area, field.areaUnit)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{field.name}</h3>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                      {field.soilType && (
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          <span>Soil: {field.soilType}</span>
                        </div>
                      )}
                      {field.irrigationType && (
                        <div className="flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-600" />
                          <span>Irrigation: {field.irrigationType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active cycle on this field */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {activeCycles.length > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <Sprout className="w-3.5 h-3.5" />
                          {activeCycles[0].crop?.name || 'Active Cycle'}
                        </span>
                        <Badge variant="active" className="text-[10px]">
                          {activeCycles[0].growthStage}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No active crop cycle</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Grid3X3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">No fields configured for this farm</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5 mb-4">
              Add fields to partition your farm into designated plots for sowing and irrigation.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setFieldForm((prev) => ({
                  ...prev,
                  area: String(remainingCapacity),
                  areaUnit: farmAreaUnit,
                }));
                setIsFieldModalOpen(true);
              }}
              icon={Plus}
            >
              Create First Field
            </Button>
          </div>
        )}
      </div>

      {/* Add Field Modal */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title="Add Field Parcel"
        subtitle={`Configure a new plot under ${farm.name}`}
      >
        <form onSubmit={handleAddFieldSubmit} className="space-y-4">
          {/* Capacity Alert in Modal */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              isAtFullCapacity
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
            }`}
          >
            {isAtFullCapacity ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold">Farm Capacity Limit: </span>
              Total {farmTotalArea.toFixed(2)} {farmAreaUnit}. Currently allocated: {totalAllocatedArea.toFixed(2)} {farmAreaUnit}.{' '}
              <strong className="underline">
                {remainingCapacity.toFixed(2)} {farmAreaUnit} remaining
              </strong>.
            </div>
          </div>

          <Input
            label="Field Name"
            required
            placeholder="e.g. North Plot / Canal Side"
            value={fieldForm.name}
            onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Area"
                required
                type="number"
                step="0.01"
                min="0.01"
                max={remainingCapacity > 0 ? remainingCapacity : undefined}
                placeholder={remainingCapacity > 0 ? `Max ${remainingCapacity.toFixed(2)}` : '0.00'}
                value={fieldForm.area}
                onChange={(e) => setFieldForm({ ...fieldForm, area: e.target.value })}
              />
              {Number(fieldForm.area) > remainingCapacity + 0.001 && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                  Exceeds remaining capacity ({remainingCapacity.toFixed(2)} {farmAreaUnit} max)
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
              value={fieldForm.areaUnit}
              onChange={(e) => setFieldForm({ ...fieldForm, areaUnit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Soil Type (Optional)"
              placeholder="e.g. Black cotton, Alluvial"
              value={fieldForm.soilType}
              onChange={(e) => setFieldForm({ ...fieldForm, soilType: e.target.value })}
            />
            <Input
              label="Irrigation Type (Optional)"
              placeholder="e.g. Drip, Sprinkler, Canal"
              value={fieldForm.irrigationType}
              onChange={(e) => setFieldForm({ ...fieldForm, irrigationType: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notes / Soil Condition
            </label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Notes on drainage, organic matter, history..."
              value={fieldForm.notes}
              onChange={(e) => setFieldForm({ ...fieldForm, notes: e.target.value })}
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsFieldModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={fieldSubmitting}
              disabled={isAtFullCapacity || Number(fieldForm.area) > remainingCapacity + 0.001}
            >
              Add Field
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FarmDetail;
