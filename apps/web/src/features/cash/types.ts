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

export interface CashMovement {
  id: string;
  cashSessionId: string;
  movementType: "income" | "expense" | string;
  amount: number;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface CashSessionSummary {
  session: {
    id: string;
    businessId: string;
    businessName: string;
    branchId: string;
    branchName: string;
    registerId: string;
    registerName: string;
    registerCode: string;
    openingAmount: number;
    closingExpected: number | null;
    closingCounted: number | null;
    differenceAmount: number | null;
    status: string;
    openedBy: string | null;
    openedByName: string | null;
    openedAt: string;
    closedBy: string | null;
    closedByName: string | null;
    closedAt: string | null;
    notes: string | null;
  };
  totals: {
    sales_total: number;
    payment_totals: {
      cash: number;
      card: number;
      transfer: number;
      mixed: number;
      store_credit: number;
    };
    manual_income_total: number;
    manual_expense_total: number;
    expected_cash: number;
  };
  movements: CashMovement[];
}

export interface OpenCashSessionPayload {
  business_id: string;
  branch_id: string;
  register_id: string;
  opening_amount: number;
  notes?: string;
}

export interface CreateCashMovementPayload {
  movement_type: "income" | "expense";
  amount: number;
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
