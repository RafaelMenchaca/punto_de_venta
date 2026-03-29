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
  customers: "/customers",
  createSale: "/sales",
  salesList: "/sales",
  saleDetail: (saleId: string) => `/sales/${saleId}`,
  saleCancel: (saleId: string) => `/sales/${saleId}/cancel`,
  saleRefunds: (saleId: string) => `/sales/${saleId}/refunds`,
  createRefund: "/refunds",
  inventoryProductsSearch: "/inventory/products/search",
  inventoryProductsList: "/inventory/products",
  inventoryCreateProduct: "/inventory/products",
  inventoryProductDetail: (productId: string) =>
    `/inventory/products/${productId}`,
  inventoryUpdateProduct: (productId: string) =>
    `/inventory/products/${productId}/update`,
  inventoryDeactivateProduct: (productId: string) =>
    `/inventory/products/${productId}/deactivate`,
  inventoryReactivateProduct: (productId: string) =>
    `/inventory/products/${productId}/reactivate`,
  inventoryProductStock: (productId: string) =>
    `/inventory/products/${productId}/stock`,
  inventoryProductMovements: (productId: string) =>
    `/inventory/products/${productId}/movements`,
  inventoryDefaultLocation: "/inventory/locations/default",
  inventoryStockAdjustments: "/inventory/stock-adjustments",
  inventoryCatalogs: "/inventory/catalogs",
  inventoryCreateCategory: "/inventory/catalogs/categories",
  inventoryCreateBrand: "/inventory/catalogs/brands",
  inventoryCreateTaxRate: "/inventory/catalogs/tax-rates",
  inventoryCreateSupplier: "/inventory/catalogs/suppliers",
  inventoryEntries: "/inventory/entries",
  health: "/health",
} as const;
