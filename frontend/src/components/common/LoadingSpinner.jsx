import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message, text = 'Loading data...', className = '' }) => {
  const display = message || text;
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">{display}</p>
    </div>
  );
};

export default LoadingSpinner;
