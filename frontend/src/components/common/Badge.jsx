import React from 'react';
import { STATUS_COLORS } from '../../utils/constants.js';

export const Badge = ({
  children,
  status,
  variant,
  className = '',
  dot = false,
}) => {
  const value = status || variant || (typeof children === 'string' ? children : '');
  const colorKey = value ? String(value).toLowerCase() : '';
  const colorClass = STATUS_COLORS[colorKey] || 'bg-slate-100 text-slate-700 border-slate-200';

  const label = children !== undefined ? children : status ? String(status).replace('_', ' ') : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${colorClass} ${className}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      )}
      {label}
    </span>
  );
};

export default Badge;
