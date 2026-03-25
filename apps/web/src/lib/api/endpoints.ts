export const apiEndpoints = {
  operatingContext: "/context/operating",
  cashOpenSession: (registerId: string) =>
    `/cash/registers/${registerId}/open-session`,
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
