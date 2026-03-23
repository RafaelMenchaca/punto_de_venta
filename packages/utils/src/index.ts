export interface ComputedSaleLine {
  lineTotal: number;
  taxTotal: number;
}

export interface ComputedSaleTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const computeLineTotals = (
  quantity: number,
  unitPrice: number,
  taxRatePercent: number,
): ComputedSaleLine => {
  const lineTotal = roundCurrency(quantity * unitPrice);
  const taxTotal = roundCurrency(lineTotal * (taxRatePercent / 100));

  return { lineTotal, taxTotal };
};

export const computeSaleTotals = (
  lines: Array<{ lineTotal: number; taxTotal: number }>,
): ComputedSaleTotals => {
  const subtotal = roundCurrency(
    lines.reduce((accumulator, line) => accumulator + line.lineTotal, 0),
  );
  const taxTotal = roundCurrency(
    lines.reduce((accumulator, line) => accumulator + line.taxTotal, 0),
  );

  return {
    subtotal,
    discountTotal: 0,
    taxTotal,
    total: roundCurrency(subtotal + taxTotal),
  };
};

export const formatCurrency = (value: number, currency = "MXN") =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
