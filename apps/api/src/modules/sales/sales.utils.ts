export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const roundQuantity = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

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

export const buildSaleFolio = (saleId: string, createdAt?: Date | string) => {
  const compactId = saleId.replace(/-/g, '').toUpperCase();
  const compactDate = buildCompactDate(createdAt);

  if (!compactDate) {
    return `VTA-${compactId.slice(-6)}`;
  }

  return `VTA-${compactDate}-${compactId.slice(-6)}`;
};

export const buildRefundFolio = (
  refundId: string,
  createdAt?: Date | string,
) => {
  const compactId = refundId.replace(/-/g, '').toUpperCase();
  const compactDate = buildCompactDate(createdAt);

  if (!compactDate) {
    return `DEV-${compactId.slice(-6)}`;
  }

  return `DEV-${compactDate}-${compactId.slice(-6)}`;
};

export const getPaymentMethodLabel = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'cash':
      return 'Efectivo';
    case 'card':
      return 'Tarjeta';
    case 'transfer':
      return 'Transferencia';
    case 'store_credit':
      return 'Credito de tienda';
    case 'mixed':
      return 'Mixto';
    default:
      return paymentMethod;
  }
};

export const allocateAmountByWeight = (
  totalAmount: number,
  weights: number[],
) => {
  if (weights.length === 0) {
    return [];
  }

  const normalizedTotal = roundCurrency(totalAmount);

  if (normalizedTotal <= 0) {
    return weights.map(() => 0);
  }

  const totalWeight = weights.reduce(
    (sum, value) => sum + Math.max(value, 0),
    0,
  );

  if (totalWeight <= 0) {
    let allocated = 0;
    const evenShare = roundCurrency(normalizedTotal / weights.length);

    return weights.map((_, index) => {
      if (index === weights.length - 1) {
        return roundCurrency(normalizedTotal - allocated);
      }

      allocated = roundCurrency(allocated + evenShare);
      return evenShare;
    });
  }

  let allocated = 0;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) {
      return roundCurrency(normalizedTotal - allocated);
    }

    const share = roundCurrency(
      (normalizedTotal * Math.max(weight, 0)) / totalWeight,
    );
    allocated = roundCurrency(allocated + share);
    return share;
  });
};
