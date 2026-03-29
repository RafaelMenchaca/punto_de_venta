export type PaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "mixed"
  | "store_credit";

export type RealPaymentMethod = Exclude<PaymentMethod, "mixed">;

export interface SaleCartItem {
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  track_inventory: boolean;
  available_stock: number;
  line_discount: number;
}

export interface SalePaymentInput {
  id: string;
  payment_method: RealPaymentMethod;
  amount: number;
  reference: string;
}

export interface SalePaymentSummary {
  methods: PaymentMethod[];
  label: string;
  totalPaid: number;
}

export interface SaleCustomer {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  notes?: string | null;
}

export interface SaleRefundItem {
  id: string;
  saleItemId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  amount: number;
}

export interface SaleRefund {
  id: string;
  folio: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  reason: string | null;
  refundedBy: string | null;
  createdAt: string;
  items: SaleRefundItem[];
}

export interface SaleDetailItem {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  baseSubtotal: number;
  discountTotal: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  refundedQuantity: number;
  remainingQuantity: number;
}

export interface SaleDetailPayment {
  id: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  amount: number;
  reference: string | null;
  paidAt: string;
}

export interface SaleDetailResponse {
  sale: {
    id: string;
    folio: string;
    businessId: string;
    businessName: string;
    branchId: string;
    branchName: string;
    registerId: string;
    registerName: string | null;
    registerCode: string | null;
    cashSessionId: string | null;
    customer: SaleCustomer | null;
    cashier: {
      id: string | null;
      fullName: string | null;
    };
    status: string;
    paymentStatus: string;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
    refundedTotal: number;
    netTotal: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    paymentSummary: SalePaymentSummary;
    canCancel: boolean;
    canRefund: boolean;
  };
  items: SaleDetailItem[];
  payments: SaleDetailPayment[];
  refunds: SaleRefund[];
}

export interface SaleListItem {
  id: string;
  folio: string;
  status: string;
  paymentStatus: string;
  customerName: string | null;
  cashierName: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  refundedTotal: number;
  netTotal: number;
  paymentSummary: SalePaymentSummary;
  createdAt: string;
  canCancel: boolean;
  canRefund: boolean;
}

export interface CreateSalePayload {
  business_id: string;
  branch_id: string;
  register_id: string;
  cash_session_id: string;
  customer_id?: string;
  notes?: string;
  sale_discount?: number;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price?: number;
    line_discount?: number;
  }>;
  payments: Array<{
    payment_method: RealPaymentMethod;
    amount: number;
    reference?: string;
  }>;
}

export type CancelSaleResponse = SaleDetailResponse;

export interface CreateRefundPayload {
  sale_id: string;
  reason?: string;
  items: Array<{
    sale_item_id: string;
    quantity: number;
  }>;
}

export interface CreateRefundResponse {
  refund: SaleRefund;
  sale: SaleDetailResponse;
}
