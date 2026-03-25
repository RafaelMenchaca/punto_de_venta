export interface ProductSearchResult {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unitPrice: number;
  trackInventory: boolean;
  taxRate: number;
  availableStock: number;
  isActive?: boolean;
  categoryName?: string | null;
  brandName?: string | null;
}
