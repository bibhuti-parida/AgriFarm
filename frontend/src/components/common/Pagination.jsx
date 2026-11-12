import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  totalItems,
  limit = 20,
  pageSize,
  onPageChange,
  className = '',
}) => {
  const effectiveTotal = totalItems !== undefined ? totalItems : total;
  const effectiveLimit = pageSize !== undefined ? pageSize : limit;

  if (totalPages <= 1 && effectiveTotal <= effectiveLimit) return null;

  const start = (page - 1) * effectiveLimit + 1;
  const end = Math.min(page * effectiveLimit, effectiveTotal);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 ${className}`}
    >
      <div>
        Showing <span className="font-semibold text-slate-700">{effectiveTotal > 0 ? start : 0}</span> to{' '}
        <span className="font-semibold text-slate-700">{end}</span> of{' '}
        <span className="font-semibold text-slate-700">{effectiveTotal}</span> records
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <span className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg">
          {page} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
