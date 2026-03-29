"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  closeCashSession,
  createCashMovement,
  getCashSessionSummary,
  getOpenCashSessionByRegister,
  openCashSession,
} from "./api";

export function useOpenCashSessionQuery(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.cashOpenSession(registerId, businessId, branchId),
    queryFn: () =>
      getOpenCashSessionByRegister(registerId!, {
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(registerId && businessId && branchId),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useCashSessionSummaryQuery(cashSessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.cashSessionSummary(cashSessionId),
    queryFn: () => getCashSessionSummary(cashSessionId!),
    enabled: Boolean(cashSessionId),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useOpenCashSessionMutation(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: openCashSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cashOpenSession(registerId, businessId, branchId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.operatingContext(businessId, branchId, registerId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["cash", "summary"],
      });
    },
  });
}

export function useCreateCashMovementMutation(
  cashSessionId: string | null,
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      movement_type: "income" | "expense";
      amount: number;
      notes?: string;
    }) => createCashMovement(cashSessionId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cashSessionSummary(cashSessionId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cashOpenSession(registerId, businessId, branchId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.operatingContext(businessId, branchId, registerId),
      });
    },
  });
}

export function useCloseCashSessionMutation(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
  cashSessionId?: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeCashSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cashOpenSession(registerId, businessId, branchId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.operatingContext(businessId, branchId, registerId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cashSessionSummary(cashSessionId ?? null),
      });
    },
  });
}
