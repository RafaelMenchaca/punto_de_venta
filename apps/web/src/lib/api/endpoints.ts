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
  purchasingSuppliers: "/purchasing/suppliers",
  purchasingSupplierDetail: (supplierId: string) =>
    `/purchasing/suppliers/${supplierId}`,
  purchasingSupplierDeactivate: (supplierId: string) =>
    `/purchasing/suppliers/${supplierId}/deactivate`,
  purchasingSupplierReactivate: (supplierId: string) =>
    `/purchasing/suppliers/${supplierId}/reactivate`,
  purchaseOrders: "/purchasing/purchase-orders",
  purchaseOrderDetail: (purchaseOrderId: string) =>
    `/purchasing/purchase-orders/${purchaseOrderId}`,
  purchaseOrderSubmit: (purchaseOrderId: string) =>
    `/purchasing/purchase-orders/${purchaseOrderId}/submit`,
  purchaseOrderCancel: (purchaseOrderId: string) =>
    `/purchasing/purchase-orders/${purchaseOrderId}/cancel`,
  goodsReceipts: "/purchasing/goods-receipts",
  goodsReceiptDetail: (goodsReceiptId: string) =>
    `/purchasing/goods-receipts/${goodsReceiptId}`,
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
  inventoryLocations: "/inventory/locations",
  inventoryLocationDetail: (locationId: string) =>
    `/inventory/locations/${locationId}`,
  inventoryLocationDeactivate: (locationId: string) =>
    `/inventory/locations/${locationId}/deactivate`,
  inventoryLocationReactivate: (locationId: string) =>
    `/inventory/locations/${locationId}/reactivate`,
  inventoryTransfers: "/inventory/transfers",
  inventoryMovements: "/inventory/movements",
  inventoryAlerts: "/inventory/alerts",
  inventoryAlertResolve: (alertId: string) =>
    `/inventory/alerts/${alertId}/resolve`,
  inventoryAlertDismiss: (alertId: string) =>
    `/inventory/alerts/${alertId}/dismiss`,
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
