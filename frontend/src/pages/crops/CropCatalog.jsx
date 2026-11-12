import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropsApi } from '../../api/crops.api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { 
  Sprout, 
  Search, 
  Calendar, 
  Scale, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function CropCatalog() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Cereal', label: 'Cereals' },
    { value: 'Pulse', label: 'Pulses' },
    { value: 'Vegetable', label: 'Vegetables' },
    { value: 'Fruit', label: 'Fruits' },
    { value: 'Oilseed', label: 'Oilseeds' },
    { value: 'Fibre', label: 'Fibre' },
    { value: 'Cash crop', label: 'Cash Crops' },
  ];

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
      };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;

      const res = await cropsApi.listCatalog(params);
      setCrops(res.data?.crops || []);
      setMeta(res.meta || { page: 1, limit: 12, total: res.data?.crops?.length || 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch crop catalog');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCrops();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Sprout className="w-5 h-5" />
            </div>
            Crop Knowledge Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified agricultural crops, standard growth durations, and estimated yields per acre.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => navigate('/crop-cycles')}
          icon={ArrowRight}
        >
          View Active Cycles
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search crops by name, category, or variety..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="w-full md:w-64">
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={categories}
          />
        </div>
      </div>

      {/* Catalog Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Loading agricultural crop catalog..." />
      ) : crops.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No crops found"
          description="Try modifying your search or category filter to discover crops."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setCategoryFilter('');
            setPage(1);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                        {crop.category || 'Crop'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {crop.name}
                      </h3>
                      {crop.variety && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Variety: <span className="font-medium text-slate-700">{crop.variety}</span>
                        </p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-5 leading-relaxed">
                    {crop.description || 'Verified agricultural cultivar optimized for regional soil conditions and seasonal crop rotation.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                        <div className="text-xs font-bold text-slate-800">
                          {crop.durationDays ? `${crop.durationDays} days` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center text-emerald-600 shadow-2xs">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Est. Yield / Acre</div>
                        <div className="text-xs font-bold text-slate-800">
                          {crop.defaultYieldPerAcre ? `${crop.defaultYieldPerAcre} ${crop.yieldUnit || 'qt'}` : 'Varies'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> ID: {crop.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => navigate('/crop-cycles', { state: { selectedCropId: crop.id } })}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 py-1 px-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Start Cycle
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={meta.limit}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
}
