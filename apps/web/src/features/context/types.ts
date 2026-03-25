import type { CashSession } from "@/features/cash/types";

export interface OperatingContextResponse {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
  };
  business: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
  register: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;
  open_cash_session: CashSession | null;
}
