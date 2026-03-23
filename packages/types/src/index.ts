export type CashSessionStatus = "open" | "closed";
export type PaymentMethod = "cash" | "card" | "transfer" | "mixed" | "other";
export type PaymentStatus = "pending" | "paid" | "partially_paid" | "refunded";
export type SaleStatus = "draft" | "completed" | "cancelled" | "refunded";
export type InventoryMovementType =
  | "sale_out"
  | "adjustment_in"
  | "adjustment_out";

export interface RequestUser {
  id: string;
  email?: string | null;
  businessId?: string | null;
  branchId?: string | null;
  registerId?: string | null;
}

export interface ProductSearchResult {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unitPrice: number;
  trackInventory: boolean;
  availableStock: number;
  taxRate: number;
}

export interface CashSessionSummary {
  id: string;
  businessId: string;
  branchId: string;
  registerId: string;
  openingAmount: number;
  status: CashSessionStatus;
  openedBy: string;
  openedAt: string;
  notes: string | null;
}

export interface CloseCashSessionSummary {
  cashSessionId: string;
  closingExpected: number;
  closingCounted: number;
  differenceAmount: number;
  status: CashSessionStatus;
  closedAt: string;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface SalePaymentInput {
  paymentMethod: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface CreateSaleInput {
  businessId: string;
  branchId: string;
  registerId: string;
  cashSessionId: string;
  customerId?: string;
  notes?: string;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
}

export interface CreateStockAdjustmentInput {
  businessId: string;
  branchId: string;
  locationId: string;
  productId: string;
  newQuantity: number;
  reason: string;
}
