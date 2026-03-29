import type { SaleCartItem, SalePaymentInput } from "./types";

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const allocateAmountByWeight = (totalAmount: number, weights: number[]) => {
  const normalizedTotal = roundCurrency(Math.max(totalAmount, 0));

  if (normalizedTotal <= 0 || weights.length === 0) {
    return weights.map(() => 0);
  }

  const totalWeight = weights.reduce((sum, weight) => sum + Math.max(weight, 0), 0);

  if (totalWeight <= 0) {
    return weights.map(() => 0);
  }

  let allocated = 0;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) {
      return roundCurrency(normalizedTotal - allocated);
    }

    const amount = roundCurrency(
      (normalizedTotal * Math.max(weight, 0)) / totalWeight,
    );
    allocated = roundCurrency(allocated + amount);
    return amount;
  });
};

export function calculateSaleTotals(
  items: SaleCartItem[],
  requestedSaleDiscount = 0,
) {
  const provisionalItems = items.map((item) => {
    const baseSubtotal = roundCurrency(item.unit_price * item.quantity);
    const lineDiscount = roundCurrency(
      Math.min(Math.max(item.line_discount || 0, 0), baseSubtotal),
    );

    return {
      ...item,
      baseSubtotal,
      lineDiscount,
      remainingForSaleDiscount: roundCurrency(baseSubtotal - lineDiscount),
    };
  });

  const grossSubtotal = roundCurrency(
    provisionalItems.reduce((sum, item) => sum + item.baseSubtotal, 0),
  );
  const lineDiscountTotal = roundCurrency(
    provisionalItems.reduce((sum, item) => sum + item.lineDiscount, 0),
  );
  const subtotalAfterLineDiscounts = roundCurrency(
    grossSubtotal - lineDiscountTotal,
  );
  const normalizedSaleDiscount = roundCurrency(
    Math.min(Math.max(requestedSaleDiscount, 0), subtotalAfterLineDiscounts),
  );
  const allocatedSaleDiscounts = allocateAmountByWeight(
    normalizedSaleDiscount,
    provisionalItems.map((item) => item.remainingForSaleDiscount),
  );

  const computedItems = provisionalItems.map((item, index) => {
    const allocatedSaleDiscount = roundCurrency(
      allocatedSaleDiscounts[index] ?? 0,
    );
    const discountTotal = roundCurrency(
      item.lineDiscount + allocatedSaleDiscount,
    );
    const subtotal = roundCurrency(item.baseSubtotal - discountTotal);
    const taxTotal = roundCurrency(subtotal * (item.tax_rate / 100));
    const total = roundCurrency(subtotal + taxTotal);

    return {
      ...item,
      allocatedSaleDiscount,
      discountTotal,
      subtotal,
      taxTotal,
      total,
    };
  });

  const discountTotal = roundCurrency(
    computedItems.reduce((sum, item) => sum + item.discountTotal, 0),
  );
  const subtotal = roundCurrency(
    computedItems.reduce((sum, item) => sum + item.subtotal, 0),
  );
  const taxTotal = roundCurrency(
    computedItems.reduce((sum, item) => sum + item.taxTotal, 0),
  );
  const total = roundCurrency(subtotal + taxTotal);

  return {
    items: computedItems,
    grossSubtotal,
    lineDiscountTotal,
    saleDiscount: normalizedSaleDiscount,
    discountTotal,
    subtotal,
    taxTotal,
    total,
  };
}

export function calculatePaymentsTotal(payments: SalePaymentInput[]) {
  return roundCurrency(
    payments.reduce((sum, payment) => sum + Math.max(payment.amount || 0, 0), 0),
  );
}
