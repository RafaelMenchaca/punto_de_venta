import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CashSession,
  CashSessionSummary,
  CloseCashSessionPayload,
  CloseCashSessionSummary,
  CreateCashMovementPayload,
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
