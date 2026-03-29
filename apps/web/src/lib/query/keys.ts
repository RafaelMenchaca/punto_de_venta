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
  ) =>
    [
      "inventory",
      "product-movements",
      productId,
      businessId,
      branchId,
    ] as const,
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
