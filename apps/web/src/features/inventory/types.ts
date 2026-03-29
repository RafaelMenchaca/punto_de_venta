export interface InventoryLocation {
  id: string;
  businessId: string;
  branchId: string;
  name: string | null;
}

export interface InventoryLocationOption {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface ProductStock {
  product_id: string;
  product_name: string;
  track_inventory: boolean;
  quantity: number;
  location_id: string | null;
}

export interface InventoryProductListItem {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  description: string | null;
  barcode: string | null;
  primaryImageUrl: string | null;
  costPrice: number;
  unitPrice: number;
  minStock: number;
  trackInventory: boolean;
  taxRate: number;
  taxRateName: string | null;
  availableStock: number;
  isActive: boolean;
  categoryName: string | null;
  brandName: string | null;
}

export interface InventoryProductDetail {
  id: string;
  businessId: string;
  categoryId: string | null;
  brandId: string | null;
  taxRateId: string | null;
  name: string;
  sku: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  trackInventory: boolean;
  isActive: boolean;
  categoryName: string | null;
  brandName: string | null;
  taxRateName: string | null;
  taxRate: number;
  primaryImageUrl: string | null;
  availableStock?: number;
  primaryBarcode: string | null;
  additionalBarcodes: string[];
}

export interface InventoryMovement {
  id: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  notes: string | null;
  referenceType: string | null;
  locationId: string;
  locationName: string;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface InventoryCatalogOption {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface InventoryTaxRateOption {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
}

export interface InventorySupplierOption {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface InventoryCatalogs {
  categories: InventoryCatalogOption[];
  brands: InventoryCatalogOption[];
  taxRates: InventoryTaxRateOption[];
  suppliers: InventorySupplierOption[];
  locations: InventoryLocationOption[];
}

export interface CreateInventoryProductPayload {
  business_id: string;
  branch_id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  tax_rate_id?: string;
  cost_price: number;
  sale_price: number;
  min_stock: number;
  track_inventory: boolean;
  barcode?: string;
  additional_barcodes?: string[];
  primary_image_url?: string;
  initial_stock?: number;
  location_id?: string;
}

export interface UpdateInventoryProductPayload {
  business_id: string;
  branch_id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  tax_rate_id?: string;
  cost_price: number;
  sale_price: number;
  min_stock: number;
  track_inventory: boolean;
  barcode?: string;
  additional_barcodes?: string[];
  primary_image_url?: string;
}

export interface DeactivateInventoryProductPayload {
  business_id: string;
}

export interface StockAdjustmentPayload {
  business_id: string;
  branch_id: string;
  location_id: string;
  product_id: string;
  new_quantity: number;
  reason: string;
}

export interface CreateInventoryEntryItemPayload {
  product_id: string;
  quantity: number;
  unit_cost?: number;
}

export interface CreateInventoryEntryPayload {
  business_id: string;
  branch_id: string;
  location_id: string;
  supplier_id?: string;
  notes?: string;
  items: CreateInventoryEntryItemPayload[];
}

export interface CreateInventoryEntryResponse {
  entry_id: string;
  location_id: string;
  supplier_id: string | null;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_cost: number;
  }>;
  created_at: string;
}

export interface CreateInventoryCategoryPayload {
  business_id: string;
  name: string;
  description?: string;
}

export interface CreateInventoryBrandPayload {
  business_id: string;
  name: string;
  description?: string;
}

export interface CreateInventoryTaxRatePayload {
  business_id: string;
  name: string;
  rate: number;
}

export interface CreateInventorySupplierPayload {
  business_id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}
