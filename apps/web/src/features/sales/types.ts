export type PaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "mixed"
  | "store_credit";

export interface SaleCartItem {
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  track_inventory: boolean;
  available_stock: number;
}

export interface CreateSalePayload {
  business_id: string;
  branch_id: string;
  register_id: string;
  cash_session_id: string;
  customer_id?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price?: number;
  }>;
  payments: Array<{
    payment_method: PaymentMethod;
    amount: number;
    reference?: string;
  }>;
}
