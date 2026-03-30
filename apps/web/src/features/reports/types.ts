export interface ReportPaymentTotals {
  cash: number;
  card: number;
  transfer: number;
  mixed: number;
  store_credit: number;
}

export interface SalesReportSummary {
  totalSales: number;
  salesCount: number;
  averageTicket: number;
  paymentTotals: ReportPaymentTotals;
  salesByStatus: Array<{
    status: string;
    count: number;
    total: number;
  }>;
}

export interface SalesReportItem {
  id: string;
  folio: string;
  status: string;
  paymentStatus: string;
  customerName: string | null;
  cashierName: string | null;
  total: number;
  paymentMethodLabel: string;
  createdAt: string;
}

export interface SalesReport {
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    branchId: string | null;
    registerId: string | null;
  };
  summary: SalesReportSummary;
  items: SalesReportItem[];
}

export interface CashSessionsReportItem {
  id: string;
  folio: string;
  branchName: string;
  registerName: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingExpected: number | null;
  closingCounted: number | null;
  differenceAmount: number | null;
  salesTotal: number;
  manualIncomeTotal: number;
  manualExpenseTotal: number;
  paymentTotals: ReportPaymentTotals;
}

export interface CashSessionsReport {
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    branchId: string | null;
    registerId: string | null;
  };
  summary: {
    sessionsCount: number;
    expectedCash: number;
    countedCash: number;
    differenceAmount: number;
    salesTotal: number;
  };
  items: CashSessionsReportItem[];
}

export interface InventoryValuationItem {
  id: string;
  name: string;
  sku: string | null;
  stockTotal: number;
  unitCost: number;
  estimatedValue: number;
  locationName: string | null;
}

export interface InventoryValuationReport {
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    branchId: string | null;
  };
  summary: {
    itemsCount: number;
    totalStockValue: number;
  };
  items: InventoryValuationItem[];
}
