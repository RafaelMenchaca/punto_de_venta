"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  cancelSale,
  createRefund,
  createSale,
  getSaleDetail,
  getSaleRefunds,
  listSales,
} from "./api";

function invalidatePosQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
  saleId?: string | null,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.cashOpenSession(registerId, businessId, branchId),
    }),
    queryClient.invalidateQueries({
      queryKey: ["cash", "summary"],
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.operatingContext(businessId, branchId, registerId),
    }),
    queryClient.invalidateQueries({
      queryKey: ["inventory"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["sales"],
    }),
    saleId
      ? queryClient.invalidateQueries({
          queryKey: queryKeys.saleDetail(saleId, businessId, branchId),
        })
      : Promise.resolve(),
    saleId
      ? queryClient.invalidateQueries({
          queryKey: queryKeys.saleRefunds(saleId, businessId, branchId),
        })
      : Promise.resolve(),
  ]);
}

export function useCreateSaleMutation(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    onSuccess: async (response) => {
      await invalidatePosQueries(
        queryClient,
        registerId,
        businessId,
        branchId,
        response.sale.id,
      );
    },
  });
}

export function useSalesListQuery(
  businessId: string | null,
  branchId: string | null,
  query: string,
  limit = 20,
) {
  return useQuery({
    queryKey: queryKeys.salesList(businessId, branchId, query.trim()),
    queryFn: () =>
      listSales({
        business_id: businessId!,
        branch_id: branchId!,
        query: query.trim() || undefined,
        limit,
      }),
    enabled: Boolean(businessId && branchId),
    staleTime: 20_000,
  });
}

export function useSaleDetailQuery(
  saleId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.saleDetail(saleId, businessId, branchId),
    queryFn: () => getSaleDetail(saleId!),
    enabled: Boolean(saleId && businessId && branchId),
  });
}

export function useSaleRefundsQuery(
  saleId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.saleRefunds(saleId, businessId, branchId),
    queryFn: () => getSaleRefunds(saleId!),
    enabled: Boolean(saleId && businessId && branchId),
  });
}

export function useCancelSaleMutation(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSale,
    onSuccess: async (response) => {
      await invalidatePosQueries(
        queryClient,
        registerId,
        businessId,
        branchId,
        response.sale.id,
      );
    },
  });
}

export function useCreateRefundMutation(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRefund,
    onSuccess: async (response) => {
      await invalidatePosQueries(
        queryClient,
        registerId,
        businessId,
        branchId,
        response.sale.sale.id,
      );
    },
  });
}
