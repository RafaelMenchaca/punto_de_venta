"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  getCashSessionsReport,
  getInventoryValuationReport,
  getSalesReport,
} from "./api";

export function useSalesReportQuery(params: {
  businessId: string | null;
  branchId: string | null;
  registerId: string | null;
  dateFrom: string;
  dateTo: string;
}) {
  return useQuery({
    queryKey: queryKeys.reportSales(
      params.businessId,
      params.branchId,
      params.registerId,
      params.dateFrom,
      params.dateTo,
    ),
    queryFn: () =>
      getSalesReport({
        business_id: params.businessId!,
        branch_id: params.branchId ?? undefined,
        register_id: params.registerId ?? undefined,
        date_from: params.dateFrom || undefined,
        date_to: params.dateTo || undefined,
      }),
    enabled: Boolean(params.businessId),
    retry: 1,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
}

export function useCashSessionsReportQuery(params: {
  businessId: string | null;
  branchId: string | null;
  registerId: string | null;
  dateFrom: string;
  dateTo: string;
}) {
  return useQuery({
    queryKey: queryKeys.reportCashSessions(
      params.businessId,
      params.branchId,
      params.registerId,
      params.dateFrom,
      params.dateTo,
    ),
    queryFn: () =>
      getCashSessionsReport({
        business_id: params.businessId!,
        branch_id: params.branchId ?? undefined,
        register_id: params.registerId ?? undefined,
        date_from: params.dateFrom || undefined,
        date_to: params.dateTo || undefined,
      }),
    enabled: Boolean(params.businessId),
    retry: 1,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryValuationReportQuery(params: {
  businessId: string | null;
  branchId: string | null;
}) {
  return useQuery({
    queryKey: queryKeys.reportInventoryValuation(
      params.businessId,
      params.branchId,
    ),
    queryFn: () =>
      getInventoryValuationReport({
        business_id: params.businessId!,
        branch_id: params.branchId ?? undefined,
      }),
    enabled: Boolean(params.businessId),
    retry: 1,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
}
