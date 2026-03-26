import type { CashSession } from "@/features/cash/types";

export interface ContextBusinessOption {
  id: string;
  name: string;
  slug: string;
}

export interface ContextBranchOption {
  id: string;
  name: string;
  code: string | null;
}

export interface ContextRegisterOption {
  id: string;
  name: string | null;
  code: string | null;
}

export interface OperatingContextResponse {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
  };
  businesses: ContextBusinessOption[];
  branches: ContextBranchOption[];
  registers: ContextRegisterOption[];
  selection: {
    business_id: string | null;
    branch_id: string | null;
    register_id: string | null;
  };
  business: {
    id: string;
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
  register: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;
  open_cash_session: CashSession | null;
}
