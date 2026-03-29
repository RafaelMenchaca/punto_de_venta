const roundPrecision = (value: number, precision: number) => {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const roundCurrency = (value: number) => roundPrecision(value, 2);

export const roundQuantity = (value: number) => roundPrecision(value, 3);

export const buildPurchaseOrderFolio = (
  purchaseOrderId: string,
  createdAt: Date | string,
) => {
  const date = new Date(createdAt);
  const suffix = purchaseOrderId.replace(/-/g, '').slice(-6).toUpperCase();
  return `OC-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${suffix}`;
};

export const buildGoodsReceiptFolio = (
  goodsReceiptId: string,
  createdAt: Date | string,
) => {
  const date = new Date(createdAt);
  const suffix = goodsReceiptId.replace(/-/g, '').slice(-6).toUpperCase();
  return `REC-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${suffix}`;
};
