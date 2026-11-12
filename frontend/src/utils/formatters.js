/**
 * Utility formatters for agricultural and financial values
 */

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount == null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (num, maxDigits = 2) => {
  if (num == null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: maxDigits,
  }).format(Number(num));
};

export const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatArea = (area, unit = 'acre') => {
  if (area == null) return '—';
  return `${formatNumber(area, 2)} ${unit}`;
};

export const formatYield = (qty, unit = 'quintal') => {
  if (qty == null) return '—';
  return `${formatNumber(qty, 2)} ${unit}`;
};
