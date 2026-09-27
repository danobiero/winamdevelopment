import { parseISO, startOfDay } from 'date-fns';

export const FormatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

export const safeParseDate = (dateStr) => {
  if (!dateStr) return null;
  // parseISO ensures "2024-05-20" stays "May 20th" regardless of timezone
  return parseISO(dateStr);
};
