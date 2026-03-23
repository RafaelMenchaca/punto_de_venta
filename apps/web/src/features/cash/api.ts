import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CashSession,
  CloseCashSessionPayload,
  CloseCashSessionSummary,
  OpenCashSessionPayload,
} from "./types";

export const getOpenCashSessionByRegister = (
  registerId: string,
  params: { business_id: string; branch_id: string },
) =>
  apiRequest<CashSession | null>(apiEndpoints.cashOpenSession(registerId), {
    query: params,
  });

export const openCashSession = (payload: OpenCashSessionPayload) =>
  apiRequest<CashSession>(apiEndpoints.cashOpen, {
    method: "POST",
    body: payload,
  });

export const closeCashSession = (payload: CloseCashSessionPayload) =>
  apiRequest<CloseCashSessionSummary>(apiEndpoints.cashClose, {
    method: "POST",
    body: payload,
  });
