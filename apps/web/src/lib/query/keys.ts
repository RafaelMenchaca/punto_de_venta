export const queryKeys = {
  operatingContext: (
    businessId: string | null,
    branchId: string | null,
    registerId: string | null,
  ) => ["context", "operating", businessId, branchId, registerId] as const,
  contextBusinesses: () => ["context", "businesses"] as const,
  contextBranches: (businessId: string | null) =>
    ["context", "branches", businessId] as const,
  contextRegisters: (businessId: string | null, branchId: string | null) =>
    ["context", "registers", businessId, branchId] as const,
  cashOpenSession: (
    registerId: string | null,
    businessId: string | null,
    branchId: string | null,
  ) => ["cash", "open-session", registerId, businessId, branchId] as const,
  cashSessionSummary: (cashSessionId: string | null) =>
    ["cash", "summary", cashSessionId] as const,
  defaultInventoryLocation: (
    businessId: string | null,
    branchId: string | null,
  ) => ["inventory", "default-location", businessId, branchId] as const,
  productSearch: (
    businessId: string | null,
    branchId: string | null,
    term: string,
  ) => ["inventory", "products", businessId, branchId, term] as const,
  customers: (businessId: string | null, term: string, limit: number) =>
    ["customers", businessId, term, limit] as const,
  salesList: (
    businessId: string | null,
    branchId: string | null,
    query: string,
  ) => ["sales", "list", businessId, branchId, query] as const,
  saleDetail: (
    saleId: string | null,
    businessId: string | null,
    branchId: string | null,
  ) => ["sales", "detail", saleId, businessId, branchId] as const,
  saleRefunds: (
    saleId: string | null,
    businessId: string | null,
    branchId: string | null,
  ) => ["sales", "refunds", saleId, businessId, branchId] as const,
  purchasingSuppliers: (businessId: string | null, term: string) =>
    ["purchasing", "suppliers", businessId, term] as const,
  purchasingSupplierDetail: (
    supplierId: string | null,
    businessId: string | null,
  ) => ["purchasing", "supplier-detail", supplierId, businessId] as const,
  purchaseOrders: (
    businessId: string | null,
    branchId: string | null,
    term: string,
  ) => ["purchasing", "orders", businessId, branchId, term] as const,
  purchaseOrderDetail: (
    purchaseOrderId: string | null,
    businessId: string | null,
    branchId: string | null,
  ) =>
    [
      "purchasing",
      "order-detail",
      purchaseOrderId,
      businessId,
      branchId,
    ] as const,
  goodsReceipts: (
    businessId: string | null,
    branchId: string | null,
    term: string,
  ) => ["purchasing", "receipts", businessId, branchId, term] as const,
  goodsReceiptDetail: (
    goodsReceiptId: string | null,
    businessId: string | null,
    branchId: string | null,
  ) =>
    [
      "purchasing",
      "receipt-detail",
      goodsReceiptId,
      businessId,
      branchId,
    ] as const,
  inventoryProductsList: (
    businessId: string | null,
    branchId: string | null,
    term: string,
    includeInactive: boolean,
  ) =>
    [
      "inventory",
      "products-list",
      businessId,
      branchId,
      term,
      includeInactive,
    ] as const,
  inventoryProductDetail: (
    productId: string | null,
    businessId: string | null,
    branchId: string | null,
  ) =>
    ["inventory", "product-detail", productId, businessId, branchId] as const,
  inventoryProductMovements: (
    productId: string | null,
    businessId: string | null,
    branchId: string | null,
    limit = 20,
  ) =>
    [
      "inventory",
      "product-movements",
      productId,
      businessId,
      branchId,
      limit,
    ] as const,
  inventoryLocations: (
    businessId: string | null,
    branchId: string | null,
    includeInactive: boolean,
  ) =>
    [
      "inventory",
      "locations",
      businessId,
      branchId,
      includeInactive,
    ] as const,
  inventoryMovements: (
    businessId: string | null,
    branchId: string | null,
    productId: string | null,
    locationId: string | null,
    movementType: string | null,
    limit: number,
  ) =>
    [
      "inventory",
      "movements",
      businessId,
      branchId,
      productId,
      locationId,
      movementType,
      limit,
    ] as const,
  inventoryAlerts: (
    businessId: string | null,
    branchId: string | null,
    status: string,
  ) => ["inventory", "alerts", businessId, branchId, status] as const,
  inventoryCatalogs: (businessId: string | null, branchId: string | null) =>
    ["inventory", "catalogs", businessId, branchId] as const,
  productStock: (
    productId: string | null,
    businessId: string | null,
    branchId: string | null,
    locationId?: string | null,
  ) =>
    [
      "inventory",
      "stock",
      productId,
      businessId,
      branchId,
      locationId,
    ] as const,
};
