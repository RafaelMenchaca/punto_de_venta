import {
  buildSaleFolio,
  getPaymentMethodLabel,
  roundCurrency,
} from '../sales/sales.utils';

const buildCompactDate = (value?: Date | string) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const buildCashSessionFolio = (
  cashSessionId: string,
  openedAt?: Date | string,
) => {
  const compactId = cashSessionId.replace(/-/g, '').toUpperCase();
  const compactDate = buildCompactDate(openedAt);

  if (!compactDate) {
    return `CAJ-${compactId.slice(-6)}`;
  }

  return `CAJ-${compactDate}-${compactId.slice(-6)}`;
};

export const buildReportPaymentTotals = (
  rows: Array<{ paymentMethod: string; amount: number }>,
) => {
  const totals = {
    cash: 0,
    card: 0,
    transfer: 0,
    mixed: 0,
    store_credit: 0,
  };

  for (const row of rows) {
    if (row.paymentMethod in totals) {
      totals[row.paymentMethod as keyof typeof totals] = roundCurrency(
        row.amount,
      );
    }
  }

  return totals;
};

export const getReportPaymentMethodLabel = (input: {
  paymentMethodsCount: number;
  primaryPaymentMethod: string | null;
}) =>
  input.paymentMethodsCount > 1
    ? 'Mixto'
    : getPaymentMethodLabel(input.primaryPaymentMethod ?? 'cash');

export { buildSaleFolio, roundCurrency };
