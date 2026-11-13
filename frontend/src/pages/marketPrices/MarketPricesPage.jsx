import React, { useState, useEffect, useCallback } from 'react';
import { marketPricesApi } from '../../api/marketPrices.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatDate } from '../../utils/formatters.js';
import { 
  TrendingUp, 
  Search, 
  MapPin, 
  Calendar, 
  Building2, 
  Info, 
  CheckCircle2, 
  Tag,
  Coins,
  RefreshCw,
  BarChart2,
  ArrowRight
} from 'lucide-react';

export default function MarketPricesPage() {
  const { showToast } = useToast();

  const [prices, setPrices] = useState([]);
  const [latestPrices, setLatestPrices] = useState([]);
  const [providerStatus, setProviderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Fetch Latest Prices Snapshot
  const fetchLatestPrices = async () => {
    try {
      const res = await marketPricesApi.getLatest();
      setLatestPrices(res.data?.latestPrices || []);
    } catch (e) {
      console.warn('Failed to load latest snapshot', e);
    }
  };

  // Fetch Market Price arrivals list
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (district.trim()) params.district = district.trim();

      const res = await marketPricesApi.list(params);
      setPrices(res.data?.prices || []);
      setProviderStatus(res.data?.providerStatus || null);
      setMeta(res.meta || { page: 1, limit: 15, total: res.data?.prices?.length || 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch agricultural market prices');
    } finally {
      setLoading(false);
    }
  }, [page, search, district]);

  useEffect(() => {
    fetchLatestPrices();
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPrices();
  };

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const res = await marketPricesApi.sync();
      showToast(
        res.data?.message || `Successfully synced ${res.data?.syncedCount || 'latest'} APMC mandi price benchmarks!`,
        'success'
      );
      await Promise.all([fetchLatestPrices(), fetchPrices()]);
    } catch (err) {
      showToast(err.message || 'Failed to sync live mandi prices', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            Agricultural Mandi Prices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time APMC mandi modal price benchmarks, daily wholesale arrivals, and price corridors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={RefreshCw}
            loading={syncing}
            onClick={handleSyncPrices}
          >
            Sync Mandi Rates
          </Button>

          {/* Provider status pill */}
          {providerStatus && (
            <div
              className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                providerStatus.isConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {providerStatus.isConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Info className="w-4 h-4 text-slate-400" />
              )}
              <span className="truncate max-w-[200px]">{providerStatus.provider}</span>
            </div>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Provider Status Details */}
      {providerStatus && (
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed">
            <strong className="font-semibold text-emerald-900">APMC Market Feed: </strong>
            {providerStatus.note} Benchmark wholesale arrivals, modal auction prices, and trading spreads are updated daily.
          </div>
        </div>
      )}

      {/* Latest Modal Prices Highlight Grid */}
      {latestPrices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            Key Commodities Snapshot (Latest Reported Modal Price)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {latestPrices.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-emerald-300 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 truncate">{item.cropName}</div>
                <div className="text-[11px] text-slate-400 truncate">{item.marketName}</div>
                <div className="text-lg font-extrabold text-emerald-600 mt-1">
                  ₹{Number(item.modalPrice).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">per {item.priceUnit ? item.priceUnit.replace('INR/', '') : 'quintal'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by crop commodity (e.g. Rice, Wheat, Tomato, Onion) or Mandi name..."
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
          <Input
            type="text"
            placeholder="Filter by district (e.g. Sambalpur, Nashik)..."
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Prices Table */}
      {loading ? (
        <LoadingSpinner message="Querying agricultural market prices & price corridors..." />
      ) : prices.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No market prices recorded"
          description="Click Sync Mandi Rates to download today's APMC benchmark arrivals and modal prices."
          actionText="Sync Mandi Rates Now"
          onAction={handleSyncPrices}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Commodity</th>
                  <th className="py-3.5 px-4">APMC Mandi</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Arrival Date</th>
                  <th className="py-3.5 px-4">Price Corridor (Min - Max)</th>
                  <th className="py-3.5 px-4 text-right">Modal Benchmark</th>
                  <th className="py-3.5 px-4">Reporting Authority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prices.map((p) => {
                  const min = Number(p.minPrice) || 0;
                  const max = Number(p.maxPrice) || 0;
                  const modal = Number(p.modalPrice) || 0;
                  const spread = max > min ? max - min : 1;
                  const modalPositionPercent = max > min ? Math.min(100, Math.max(0, ((modal - min) / spread) * 100)) : 50;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          {p.cropName}
                        </div>
                        {p.crop?.category && (
                          <div className="text-[11px] text-slate-500 pl-5">
                            {p.crop.category}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {p.marketName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {p.district || 'District'}
                        </div>
                        <div className="text-slate-400 pl-4 text-[11px]">{p.state || 'India'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(p.priceDate)}
                        </div>
                      </td>

                      {/* Visual Price Corridor (Floor -> Modal -> Ceiling) */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap min-w-[180px]">
                        {min > 0 && max > 0 ? (
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                              <span>₹{min.toLocaleString()}</span>
                              <span>₹{max.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-1 relative">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${modalPositionPercent}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Floor</span>
                              <span>Ceiling</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="text-base font-extrabold text-emerald-700">
                          ₹{modal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">per {p.priceUnit ? p.priceUnit.replace('INR/', '') : 'quintal'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-medium inline-block max-w-[200px] truncate" title={p.source}>
                          {p.source || 'APMC Mandi'}
                        </span>
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
    </div>
  );
}
