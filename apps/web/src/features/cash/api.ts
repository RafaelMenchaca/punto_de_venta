import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CashSession,
  CashSessionListItem,
  CashSessionSummary,
  CloseCashSessionPayload,
  CloseCashSessionSummary,
  CreateCashMovementPayload,
  CashSessionsListFilters,
  OpenCashSessionPayload,
} from "./types";

export const getOpenCashSessionByRegister = (
  registerId: string,
  params: { business_id: string; branch_id: string },
) =>
  apiRequest<CashSession | null>(apiEndpoints.cashOpenSession(registerId), {
    query: params,
  });

export const getCashSessionSummary = (cashSessionId: string) =>
  apiRequest<CashSessionSummary>(apiEndpoints.cashSessionSummary(cashSessionId));

export const getCashSessions = (params: CashSessionsListFilters) =>
  apiRequest<CashSessionListItem[]>(apiEndpoints.cashSessionsList, {
    query: {
      business_id: params.business_id,
      branch_id: params.branch_id,
      register_id: params.register_id,
      status: params.status,
      date_from: params.date_from,
      date_to: params.date_to,
      limit: params.limit,
    },
  });

export const openCashSession = (payload: OpenCashSessionPayload) =>
  apiRequest<CashSession>(apiEndpoints.cashOpen, {
    method: "POST",
    body: payload,
  });

export const createCashMovement = (
  cashSessionId: string,
  payload: CreateCashMovementPayload,
) =>
  apiRequest<{
    movement: CashSessionSummary["movements"][number];
    expected_cash: number;
  }>(apiEndpoints.cashSessionMovements(cashSessionId), {
    method: "POST",
    body: payload,
  });

export const closeCashSession = (payload: CloseCashSessionPayload) =>
  apiRequest<CloseCashSessionSummary>(apiEndpoints.cashClose, {
    method: "POST",
    body: payload,
  });
