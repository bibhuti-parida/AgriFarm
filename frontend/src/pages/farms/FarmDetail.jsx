import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { farmsApi } from '../../api/farms.api.js';
import { fieldsApi } from '../../api/fields.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatArea, formatDate } from '../../utils/formatters.js';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Select } from '../../components/common/Select.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { ErrorAlert } from '../../components/common/ErrorAlert.jsx';
import {
  Tractor,
  MapPin,
  Plus,
  ArrowLeft,
  Grid3X3,
  Sprout,
  Droplets,
  Layers,
  Thermometer,
} from 'lucide-react';

export const FarmDetail = () => {
  const { id } = useParams();
  const { success, error: toastError } = useToast();

  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Field Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    area: '',
    areaUnit: 'acre',
    soilType: '',
    irrigationType: '',
    notes: '',
    status: 'active',
  });
  const [fieldSubmitting, setFieldSubmitting] = useState(false);

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

  const handleAddFieldSubmit = async (e) => {
    e.preventDefault();
    setFieldSubmitting(true);
    try {
      await fieldsApi.createOnFarm(id, {
        name: fieldForm.name.trim(),
        area: Number(fieldForm.area),
        areaUnit: fieldForm.areaUnit || 'acre',
        soilType: fieldForm.soilType.trim() || undefined,
        irrigationType: fieldForm.irrigationType.trim() || undefined,
        notes: fieldForm.notes.trim() || undefined,
        status: fieldForm.status,
      });
      success('Field created successfully!');
      setIsFieldModalOpen(false);
      setFieldForm({
        name: '',
        area: '',
        areaUnit: 'acre',
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

  const fields = farm?.fields || [];
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
                Total: {formatArea(farm.totalArea, farm.areaUnit)}
              </span>
            </div>

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {farm.description || 'No detailed description provided for this agricultural holding.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
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

      {/* Fields Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Field Parcels ({fields.length})
            </h2>
            <p className="text-xs text-slate-500">Configured plots and active crop cycles on this farm</p>
          </div>
          <Button onClick={() => setIsFieldModalOpen(true)} icon={Plus} size="sm">
            Add Field
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
            <Button size="sm" onClick={() => setIsFieldModalOpen(true)} icon={Plus}>
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
          <Input
            label="Field Name"
            required
            placeholder="e.g. North Plot / Canal Side"
            value={fieldForm.name}
            onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Area"
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="4.5"
              value={fieldForm.area}
              onChange={(e) => setFieldForm({ ...fieldForm, area: e.target.value })}
            />
            <Select
              label="Area Unit"
              options={[
                { value: 'acre', label: 'Acres' },
                { value: 'hectare', label: 'Hectares' },
                { value: 'bigha', label: 'Bigha' },
                { value: 'guntha', label: 'Guntha' },
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
            <Button type="submit" variant="primary" loading={fieldSubmitting}>
              Add Field
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FarmDetail;
