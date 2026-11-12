import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export const ErrorAlert = ({ message, onRetry, className = '' }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold">Error occurred</h4>
        <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          className="border-rose-300 text-rose-700 hover:bg-rose-100 flex-shrink-0"
          onClick={onRetry}
          icon={RefreshCw}
        >
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorAlert;
