import React from 'react';
import { Menu, Tractor, User, ChevronDown } from 'lucide-react';
import { useFarm } from '../../context/FarmContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

export const Topbar = ({ onOpenSidebar }) => {
  const { farms, selectedFarmId, selectFarm, loading } = useFarm();
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Farm Switcher */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Tractor className="w-4 h-4" />
          </div>
          <div className="relative">
            <select
              value={selectedFarmId}
              onChange={(e) => selectFarm(e.target.value)}
              disabled={loading}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">All Farms (Aggregated View)</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} {farm.district ? `(${farm.district})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-800 leading-tight">
              {user?.fullName || 'Farmer'}
            </span>
            <span className="block text-[11px] text-slate-500 capitalize">
              {user?.status || 'Active'} Account
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};
