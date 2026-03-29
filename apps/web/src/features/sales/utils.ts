import { calculatePaymentsTotal, calculateSaleTotals } from "./calculations";
import { getPaymentMethodLabel } from "./presentation";
import type {
  PaymentMethod,
  SaleCartItem,
  SalePaymentInput,
} from "./types";

export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export { getPaymentMethodLabel };

export function normalizePaymentsForSale(
  payments: SalePaymentInput[],
  saleTotal: number,
) {
  const normalizedSaleTotal = roundCurrency(Math.max(saleTotal, 0));
  const receivedPayments = payments.map((payment) => ({
    ...payment,
    amount: roundCurrency(Math.max(payment.amount || 0, 0)),
  }));
  const receivedTotal = calculatePaymentsTotal(receivedPayments);
  const appliedPayments = receivedPayments.map((payment) => ({
    ...payment,
    amount: payment.amount,
  }));

  let remainingChange = roundCurrency(
    Math.max(receivedTotal - normalizedSaleTotal, 0),
  );

  if (remainingChange > 0) {
    for (let index = appliedPayments.length - 1; index >= 0; index -= 1) {
      const payment = appliedPayments[index];

      if (!payment || payment.payment_method !== "cash") {
        continue;
      }

      const reduction = roundCurrency(
        Math.min(payment.amount, remainingChange),
      );

      if (reduction <= 0) {
        continue;
      }

      payment.amount = roundCurrency(payment.amount - reduction);
      remainingChange = roundCurrency(remainingChange - reduction);

      if (remainingChange <= 0.009) {
        remainingChange = 0;
        break;
      }
    }
  }

  const nonZeroAppliedPayments = appliedPayments.filter(
    (payment) => payment.amount > 0.009,
  );
  const appliedTotal = calculatePaymentsTotal(nonZeroAppliedPayments);
  const remaining = roundCurrency(Math.max(normalizedSaleTotal - appliedTotal, 0));
  const change = roundCurrency(Math.max(receivedTotal - appliedTotal, 0));
  const hasUnsupportedChange = remainingChange > 0.009;

  return {
    receivedTotal,
    appliedTotal,
    remaining,
    change,
    hasUnsupportedChange,
    appliedPayments: nonZeroAppliedPayments,
    isPaymentReady:
      normalizedSaleTotal > 0 &&
      !hasUnsupportedChange &&
      Math.abs(remaining) < 0.009,
  };
}

export function calculateCartTotals(
  items: SaleCartItem[],
  saleDiscount = 0,
  payments: SalePaymentInput[] = [],
) {
  const saleTotals = calculateSaleTotals(items, saleDiscount);
  const paymentTotals = normalizePaymentsForSale(payments, saleTotals.total);

  return {
    ...saleTotals,
    paidTotal: paymentTotals.appliedTotal,
    receivedTotal: paymentTotals.receivedTotal,
    remaining: paymentTotals.remaining,
    change: paymentTotals.change,
    hasUnsupportedChange: paymentTotals.hasUnsupportedChange,
    appliedPayments: paymentTotals.appliedPayments,
    isPaymentReady: paymentTotals.isPaymentReady,
  };
}

export const normalizePaymentMethod = (paymentMethod: string) =>
  paymentMethod as PaymentMethod;
