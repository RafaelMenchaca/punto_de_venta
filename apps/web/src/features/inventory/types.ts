export interface InventoryLocation {
  id: string;
  businessId: string;
  branchId: string;
  name: string | null;
}

export interface ProductStock {
  product_id: string;
  product_name: string;
  track_inventory: boolean;
  quantity: number;
  location_id: string | null;
}

export interface StockAdjustmentPayload {
  business_id: string;
  branch_id: string;
  location_id: string;
  product_id: string;
  new_quantity: number;
  reason: string;
}
