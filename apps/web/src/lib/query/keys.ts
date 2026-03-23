export const queryKeys = {
  cashOpenSession: (
    registerId: string | null,
    businessId: string | null,
    branchId: string | null,
  ) => ["cash", "open-session", registerId, businessId, branchId] as const,
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
