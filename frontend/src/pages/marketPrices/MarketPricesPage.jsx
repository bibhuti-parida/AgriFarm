import React, { useState, useEffect, useCallback } from 'react';
import { marketPricesApi } from '../../api/marketPrices.api.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { 
  TrendingUp, 
  Search, 
  MapPin, 
  Calendar, 
  Building2, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  Coins
} from 'lucide-react';

export default function MarketPricesPage() {
  const [prices, setPrices] = useState([]);
  const [latestPrices, setLatestPrices] = useState([]);
  const [providerStatus, setProviderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
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

        {/* Provider integration pill */}
        {providerStatus && (
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border ${
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
            <span>Source: {providerStatus.provider}</span>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Provider configuration transparency notice */}
      {providerStatus && !providerStatus.isConfigured && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong className="font-semibold">Mandi Data Integration: </strong>
            {providerStatus.note} Verified historical records and benchmark arrivals are displayed below.
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
                <div className="text-[10px] text-slate-400">per {item.priceUnit || 'qt'}</div>
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
              placeholder="Search by crop commodity or mandi name..."
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
            placeholder="Filter by district (e.g. Sambalpur)..."
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
        <LoadingSpinner message="Querying agricultural market prices..." />
      ) : prices.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No market prices recorded"
          description="Try clearing your search query or searching for a different crop."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setDistrict('');
            setPage(1);
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Commodity</th>
                  <th className="py-3.5 px-4">Mandi / Market</th>
                  <th className="py-3.5 px-4">District & State</th>
                  <th className="py-3.5 px-4">Arrival Date</th>
                  <th className="py-3.5 px-4 text-right">Min - Max Price</th>
                  <th className="py-3.5 px-4 text-right">Modal Price</th>
                  <th className="py-3.5 px-4">Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prices.map((p) => (
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

                    <td className="py-3.5 px-4 text-right text-xs text-slate-600 whitespace-nowrap">
                      {p.minPrice && p.maxPrice ? (
                        <span>
                          ₹{Number(p.minPrice).toLocaleString()} - ₹{Number(p.maxPrice).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="text-base font-extrabold text-emerald-700">
                        ₹{Number(p.modalPrice).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">per {p.priceUnit || 'quintal'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                        {p.source || 'APMC Mandi'}
                      </span>
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
    </div>
  );
}
