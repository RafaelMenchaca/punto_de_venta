import type {
  PurchaseOrderDetail,
  PurchaseOrderLineInput,
  PurchasingOrderItem,
  PurchasingReceipt,
} from "./types";

export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const roundQuantity = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

export const formatQuantity = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(value) ? value : 0);

export function calculateLineTotals(line: {
  quantity: number;
  unitCost: number;
  taxRate: number;
}) {
  const subtotal = roundCurrency(
    Math.max(line.quantity, 0) * Math.max(line.unitCost, 0),
  );
  const taxTotal = roundCurrency(subtotal * Math.max(line.taxRate, 0) / 100);
  const total = roundCurrency(subtotal + taxTotal);

  return {
    subtotal,
    taxTotal,
    total,
  };
}

export function calculatePurchaseOrderTotals(
  lines: PurchaseOrderLineInput[] | PurchasingOrderItem[],
) {
  const summary = lines.reduce(
    (accumulator, line) => {
      const quantity = "quantity" in line ? Number(line.quantity) : 0;
      const unitCost = "unit_cost" in line ? Number(line.unit_cost) : line.unitCost;
      const taxRate = "tax_rate" in line ? Number(line.tax_rate) : line.taxRate;
      const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;
      const normalizedUnitCost = Number.isFinite(unitCost) ? unitCost : 0;
      const normalizedTaxRate = Number.isFinite(taxRate) ? taxRate : 0;
      const totals = calculateLineTotals({
        quantity: normalizedQuantity,
        unitCost: normalizedUnitCost,
        taxRate: normalizedTaxRate,
      });

      accumulator.subtotal = roundCurrency(accumulator.subtotal + totals.subtotal);
      accumulator.taxTotal = roundCurrency(accumulator.taxTotal + totals.taxTotal);
      accumulator.total = roundCurrency(accumulator.total + totals.total);
      return accumulator;
    },
    {
      subtotal: 0,
      taxTotal: 0,
      total: 0,
    },
  );

  return summary;
}

export function getPurchaseOrderStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Borrador";
    case "submitted":
      return "Enviada";
    case "partially_received":
      return "Recepcion parcial";
    case "received":
      return "Recibida";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

export function getSupplierStatusLabel(isActive: boolean) {
  return isActive ? "Activo" : "Inactivo";
}

export function derivePendingQuantity(item: {
  quantity: number;
  receivedQuantity?: number;
  pendingQuantity?: number;
}) {
  if (typeof item.pendingQuantity === "number") {
    return item.pendingQuantity;
  }

  return roundQuantity(
    Math.max(item.quantity - (item.receivedQuantity ?? 0), 0),
  );
}

export function summarizeReceipts(receipts: PurchasingReceipt[]) {
  return receipts.reduce(
    (accumulator, receipt) => {
      accumulator.itemsCount += receipt.items.length;
      return accumulator;
    },
    { itemsCount: 0 },
  );
}

export function summarizeOrderDetail(detail: PurchaseOrderDetail | null) {
  if (!detail) {
    return {
      receivedQuantity: 0,
      pendingQuantity: 0,
    };
  }

  return detail.items.reduce(
    (accumulator, item) => {
      accumulator.receivedQuantity = roundQuantity(
        accumulator.receivedQuantity + (item.receivedQuantity ?? 0),
      );
      accumulator.pendingQuantity = roundQuantity(
        accumulator.pendingQuantity + derivePendingQuantity(item),
      );
      return accumulator;
    },
    {
      receivedQuantity: 0,
      pendingQuantity: 0,
    },
  );
}
