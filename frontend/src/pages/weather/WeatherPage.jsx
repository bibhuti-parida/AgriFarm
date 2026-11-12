import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { weatherApi } from '../../api/weather.api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import Button from '../../components/common/Button.jsx';
import Select from '../../components/common/Select.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import { 
  CloudSun, 
  RefreshCw, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  MapPin, 
  AlertTriangle, 
  Sun, 
  CloudLightning, 
  CloudDrizzle, 
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function WeatherPage() {
  const navigate = useNavigate();
  const { currentFarm, farms } = useFarm();
  const { showToast } = useToast();

  const [selectedFarmId, setSelectedFarmId] = useState(currentFarm?.id || '');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentFarm?.id) {
      setSelectedFarmId(currentFarm.id);
    }
  }, [currentFarm]);

  const fetchWeather = useCallback(async (farmId) => {
    if (!farmId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.getByFarm(farmId);
      setWeatherData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load weather data');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      fetchWeather(selectedFarmId);
    } else {
      setLoading(false);
    }
  }, [selectedFarmId, fetchWeather]);

  const handleForceRefresh = async () => {
    if (!selectedFarmId) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await weatherApi.refreshForFarm(selectedFarmId);
      setWeatherData(res.data);
      showToast('Live weather observation updated', 'success');
    } catch (err) {
      showToast(err.message || 'Weather refresh failed', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const selectedFarm = farms.find((f) => f.id === selectedFarmId);
  const hasCoordinates = selectedFarm?.latitude != null && selectedFarm?.longitude != null;

  // Advisory generator based on meteorological metrics
  const getAgriAdvisory = (record) => {
    if (!record) return null;
    const tips = [];
    if (record.rainfallMm > 2) {
      tips.push({
        type: 'warning',
        title: 'Active Rainfall Warning',
        text: 'Heavy moisture detected. Postpone pesticide/fertilizer spraying to prevent chemical runoff.',
      });
    }
    if (record.temperatureC > 34) {
      tips.push({
        type: 'caution',
        title: 'High Heat Advisory',
        text: 'Irrigate during early morning or late dusk to prevent heat stress and soil moisture loss.',
      });
    }
    if (record.windSpeed > 20) {
      tips.push({
        type: 'warning',
        title: 'High Wind Velocities',
        text: 'Avoid foliar crop dusting and ensure greenhouse or trellis structures are well anchored.',
      });
    }
    if (tips.length === 0) {
      tips.push({
        type: 'optimal',
        title: 'Favourable Field Conditions',
        text: 'Optimal weather for ongoing sowing, intercultural weeding, and scheduled harvest operations.',
      });
    }
    return tips;
  };

  const weather = weatherData?.weather;
  const advisory = getAgriAdvisory(weather);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CloudSun className="w-5 h-5" />
            </div>
            Microclimate & Weather Radar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time agro-meteorological observations, rainfall forecasts, and automated crop advisories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={refreshing}
            onClick={handleForceRefresh}
            disabled={!hasCoordinates || loading}
          >
            Force Sync
          </Button>
        </div>
      </div>

      {/* Farm Switcher Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Farm Location</div>
            <div className="text-sm font-bold text-slate-900">{selectedFarm?.name || 'Select Farm'}</div>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            options={farms.map((f) => ({
              value: f.id,
              label: `${f.name} (${f.location || 'Location'})`,
            }))}
          />
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Missing Coordinates Notification */}
      {!hasCoordinates && selectedFarm && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Geographic Coordinates Required</h3>
              <p className="text-xs text-amber-800/80 mt-1 max-w-xl">
                Farm <strong>{selectedFarm.name}</strong> does not have latitude and longitude coordinates configured. Precise GPS coordinates are needed to pull hyper-local satellite and weather data.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/farms/${selectedFarm.id}`)}
            icon={ArrowRight}
          >
            Set Coordinates
          </Button>
        </div>
      )}

      {/* Weather Content */}
      {loading ? (
        <LoadingSpinner message="Fetching meteorological telemetry for your farm..." />
      ) : !weather ? (
        <EmptyState
          icon={CloudSun}
          title="No weather data available"
          description="Ensure your farm has valid latitude and longitude coordinates and click Force Sync."
          actionText={hasCoordinates ? 'Sync Weather Now' : 'Configure Farm Coordinates'}
          onAction={hasCoordinates ? handleForceRefresh : () => navigate(`/farms/${selectedFarmId}`)}
        />
      ) : (
        <div className="space-y-6">
          {/* Main Weather Card */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full">
                    {weatherData.cached ? 'Station Cache' : 'Live Satellite Feed'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                    {weatherData.farm?.name}
                  </h2>
                  <p className="text-xs text-emerald-200/80 mt-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    GPS: {Number(weatherData.farm?.latitude).toFixed(4)}° N, {Number(weatherData.farm?.longitude).toFixed(4)}° E
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-emerald-300/80">Last Recorded</div>
                  <div className="text-xs font-medium text-white mt-0.5">
                    {formatDateTime(weather.observedAt)}
                  </div>
                </div>
              </div>

              {/* Temperature & Main condition */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-6 border-y border-white/10">
                <div className="flex items-center gap-6">
                  <div className="text-6xl sm:text-7xl font-black tracking-tighter text-white">
                    {Math.round(weather.temperatureC)}°<span className="text-3xl text-emerald-300 font-light">C</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-100 capitalize">
                      {weather.condition}
                    </div>
                    <div className="text-xs text-emerald-200/70 mt-1">
                      Feels like {Math.round(weather.feelsLikeC || weather.temperatureC)}°C
                    </div>
                  </div>
                </div>

                {/* Sub metrics grid */}
                <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full md:w-auto">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-200 mb-1">
                      <Droplets className="w-4 h-4" />
                      Humidity
                    </div>
                    <div className="text-xl font-bold text-white">
                      {weather.humidityPercent}%
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-200 mb-1">
                      <CloudRain className="w-4 h-4" />
                      Precipitation
                    </div>
                    <div className="text-xl font-bold text-white">
                      {weather.rainfallMm} <span className="text-xs font-normal">mm</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-200 mb-1">
                      <Wind className="w-4 h-4" />
                      Wind Speed
                    </div>
                    <div className="text-xl font-bold text-white">
                      {weather.windSpeed} <span className="text-xs font-normal">km/h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status info bar */}
              {weatherData.notice && (
                <div className="mt-4 text-xs text-amber-200 bg-amber-900/40 border border-amber-500/30 px-3.5 py-2 rounded-xl">
                  {weatherData.notice}
                </div>
              )}
            </div>
          </div>

          {/* Agricultural Field Advisory Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Agronomic Field Advisory
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {advisory.map((adv, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    adv.type === 'warning'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : adv.type === 'caution'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      adv.type === 'warning'
                        ? 'bg-rose-100 text-rose-600'
                        : adv.type === 'caution'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {adv.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{adv.title}</h4>
                    <p className="text-xs opacity-90 mt-1 leading-relaxed">{adv.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
