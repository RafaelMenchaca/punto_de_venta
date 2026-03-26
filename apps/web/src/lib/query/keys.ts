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
