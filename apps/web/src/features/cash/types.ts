export interface CashSession {
  id: string;
  businessId: string;
  branchId: string;
  registerId: string;
  openingAmount: number;
  status: string;
  openedBy: string;
  openedAt: string;
  notes: string | null;
}

export interface OpenCashSessionPayload {
  business_id: string;
  branch_id: string;
  register_id: string;
  opening_amount: number;
  notes?: string;
}

export interface CloseCashSessionPayload {
  cash_session_id: string;
  closing_counted: number;
  notes?: string;
}

export interface CloseCashSessionSummary {
  cash_session_id: string;
  closing_expected: number;
  closing_counted: number;
  difference_amount: number;
  status: string;
  closed_at: string;
}
