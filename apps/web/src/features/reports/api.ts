import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CashSessionsReport,
  InventoryValuationReport,
  SalesReport,
} from "./types";

export const getSalesReport = (params: {
  business_id: string;
  branch_id?: string;
  register_id?: string;
  date_from?: string;
  date_to?: string;
}) =>
  apiRequest<SalesReport>(apiEndpoints.reportsSales, {
    query: params,
  });

export const getCashSessionsReport = (params: {
  business_id: string;
  branch_id?: string;
  register_id?: string;
  date_from?: string;
  date_to?: string;
}) =>
  apiRequest<CashSessionsReport>(apiEndpoints.reportsCashSessions, {
    query: params,
  });

export const getInventoryValuationReport = (params: {
  business_id: string;
  branch_id?: string;
}) =>
  apiRequest<InventoryValuationReport>(
    apiEndpoints.reportsInventoryValuation,
    {
      query: params,
    },
  );
