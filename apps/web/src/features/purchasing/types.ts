export type PurchaseOrderStatus =
  | "draft"
  | "submitted"
  | "partially_received"
  | "received"
  | "cancelled";

export interface PurchasingSupplier {
  id: string;
  businessId: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderSupplierSummary {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface PurchasingOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  unitCost: number;
  taxRate: number;
  subtotal: number;
  taxTotal: number;
  total: number;
}

export interface PurchasingReceiptItem {
  id: string;
  purchaseOrderItemId: string | null;
  goodsReceiptId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchasingReceipt {
  id: string;
  folio: string;
  purchaseOrderId: string | null;
  purchaseOrderFolio: string | null;
  businessId: string;
  branchId: string;
  supplierId: string | null;
  supplierName: string | null;
  locationId: string;
  locationName: string;
  receivedBy: string | null;
  receivedByName: string | null;
  notes: string | null;
  createdAt: string;
  itemsCount: number;
  totalQuantity: number;
  totalCost: number;
  purchaseOrderStatus: PurchaseOrderStatus | null;
  items: PurchasingReceiptItem[];
}

export interface PurchaseOrderListItem {
  id: string;
  folio: string;
  status: PurchaseOrderStatus;
  supplierId: string;
  supplierName: string;
  orderedByName: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  itemsCount: number;
  receiptCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canSubmit: boolean;
  canCancel: boolean;
}

export interface PurchaseOrderDetail {
  id: string;
  folio: string;
  status: PurchaseOrderStatus;
  businessId: string;
  branchId: string;
  supplier: PurchaseOrderSupplierSummary | null;
  orderedByName: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canSubmit: boolean;
  canCancel: boolean;
  items: PurchasingOrderItem[];
  receipts: PurchasingReceipt[];
}

export interface GoodsReceiptListItem {
  id: string;
  folio: string;
  purchaseOrderId: string | null;
  purchaseOrderFolio: string | null;
  businessId: string;
  branchId: string;
  supplierId: string | null;
  supplierName: string | null;
  locationId: string;
  locationName: string;
  receivedBy: string | null;
  receivedByName: string | null;
  notes: string | null;
  createdAt: string;
  itemsCount: number;
  totalQuantity: number;
  totalCost: number;
  purchaseOrderStatus: PurchaseOrderStatus | null;
  items: PurchasingReceiptItem[];
}

export type GoodsReceiptDetail = GoodsReceiptListItem;

export interface CreateSupplierPayload {
  business_id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierPayload {
  business_id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CreatePurchaseOrderItemPayload {
  product_id: string;
  quantity: number;
  unit_cost: number;
  tax_rate?: number;
}

export interface CreatePurchaseOrderPayload {
  business_id: string;
  branch_id: string;
  supplier_id: string;
  notes?: string;
  items: CreatePurchaseOrderItemPayload[];
}

export interface UpdatePurchaseOrderPayload {
  business_id: string;
  branch_id: string;
  supplier_id: string;
  notes?: string;
  items: CreatePurchaseOrderItemPayload[];
}

export interface PurchaseOrderLineInput {
  id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: string;
  unit_cost: string;
  tax_rate: string;
}

export interface CreateGoodsReceiptItemPayload {
  purchase_order_item_id?: string;
  product_id: string;
  quantity: number;
  unit_cost?: number;
}

export interface CreateGoodsReceiptPayload {
  business_id: string;
  branch_id: string;
  purchase_order_id: string;
  location_id: string;
  notes?: string;
  items: CreateGoodsReceiptItemPayload[];
}
