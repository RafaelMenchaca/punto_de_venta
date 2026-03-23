"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  closeCashSession,
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
    },
  });
}

export function useCloseCashSessionMutation(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeCashSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cashOpenSession(registerId, businessId, branchId),
      });
    },
  });
}
