export const apiEndpoints = {
  operatingContext: "/context/operating",
  contextBusinesses: "/context/businesses",
  contextBranches: "/context/branches",
  contextRegisters: "/context/registers",
  cashOpenSession: (registerId: string) =>
    `/cash/registers/${registerId}/open-session`,
  cashSessionSummary: (cashSessionId: string) =>
    `/cash/sessions/${cashSessionId}/summary`,
  cashSessionMovements: (cashSessionId: string) =>
    `/cash/sessions/${cashSessionId}/movements`,
  cashOpen: "/cash/sessions/open",
  cashClose: "/cash/sessions/close",
  createSale: "/sales",
  inventoryProductsSearch: "/inventory/products/search",
  inventoryCreateProduct: "/inventory/products",
  inventoryDeactivateProduct: (productId: string) =>
    `/inventory/products/${productId}/deactivate`,
  inventoryProductStock: (productId: string) =>
    `/inventory/products/${productId}/stock`,
  inventoryDefaultLocation: "/inventory/locations/default",
  inventoryStockAdjustments: "/inventory/stock-adjustments",
  health: "/health",
} as const;
