"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  cancelPurchaseOrder,
  createGoodsReceipt,
  createPurchaseOrder,
  createPurchasingSupplier,
  deactivatePurchasingSupplier,
  getGoodsReceiptDetail,
  getPurchaseOrderDetail,
  getPurchasingSupplierDetail,
  listGoodsReceipts,
  listPurchaseOrders,
  listPurchasingSuppliers,
  reactivatePurchasingSupplier,
  submitPurchaseOrder,
  updatePurchaseOrder,
  updatePurchasingSupplier,
} from "./api";

const invalidatePurchasingData = async (
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: string | null,
  branchId: string | null,
) => {
  await queryClient.invalidateQueries({ queryKey: ["purchasing"] });
  await queryClient.invalidateQueries({ queryKey: ["inventory"] });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.inventoryCatalogs(businessId, branchId),
  });
};

export function usePurchasingSuppliersQuery(
  businessId: string | null,
  term: string,
  includeInactive = true,
) {
  return useQuery({
    queryKey: queryKeys.purchasingSuppliers(businessId, term.trim()),
    queryFn: () =>
      listPurchasingSuppliers({
        business_id: businessId!,
        query: term.trim() || undefined,
        include_inactive: includeInactive,
      }),
    enabled: Boolean(businessId),
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function usePurchasingSupplierDetailQuery(
  supplierId: string | null,
  businessId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.purchasingSupplierDetail(supplierId, businessId),
    queryFn: () => getPurchasingSupplierDetail(supplierId!, { business_id: businessId! }),
    enabled: Boolean(supplierId && businessId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useCreatePurchasingSupplierMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchasingSupplier,
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function useUpdatePurchasingSupplierMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplierId,
      payload,
    }: {
      supplierId: string;
      payload: Parameters<typeof updatePurchasingSupplier>[1];
    }) => updatePurchasingSupplier(supplierId, payload),
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function useDeactivatePurchasingSupplierMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplierId,
      payload,
    }: {
      supplierId: string;
      payload: { business_id: string };
    }) => deactivatePurchasingSupplier(supplierId, payload),
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function useReactivatePurchasingSupplierMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplierId,
      payload,
    }: {
      supplierId: string;
      payload: { business_id: string };
    }) => reactivatePurchasingSupplier(supplierId, payload),
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function usePurchaseOrdersQuery(
  businessId: string | null,
  branchId: string | null,
  term: string,
) {
  return useQuery({
    queryKey: queryKeys.purchaseOrders(businessId, branchId, term.trim()),
    queryFn: () =>
      listPurchaseOrders({
        business_id: businessId!,
        branch_id: branchId!,
        query: term.trim() || undefined,
        limit: 50,
      }),
    enabled: Boolean(businessId && branchId),
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function usePurchaseOrderDetailQuery(
  purchaseOrderId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.purchaseOrderDetail(
      purchaseOrderId,
      businessId,
      branchId,
    ),
    queryFn: () =>
      getPurchaseOrderDetail(purchaseOrderId!, {
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(purchaseOrderId && businessId && branchId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useCreatePurchaseOrderMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function useUpdatePurchaseOrderMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseOrderId,
      payload,
    }: {
      purchaseOrderId: string;
      payload: Parameters<typeof updatePurchaseOrder>[1];
    }) => updatePurchaseOrder(purchaseOrderId, payload),
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function useSubmitPurchaseOrderMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseOrderId,
      payload,
    }: {
      purchaseOrderId: string;
      payload: { business_id: string; branch_id: string };
    }) => submitPurchaseOrder(purchaseOrderId, payload),
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function useCancelPurchaseOrderMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseOrderId,
      payload,
    }: {
      purchaseOrderId: string;
      payload: { business_id: string; branch_id: string };
    }) => cancelPurchaseOrder(purchaseOrderId, payload),
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}

export function useGoodsReceiptsQuery(
  businessId: string | null,
  branchId: string | null,
  term: string,
) {
  return useQuery({
    queryKey: queryKeys.goodsReceipts(businessId, branchId, term.trim()),
    queryFn: () =>
      listGoodsReceipts({
        business_id: businessId!,
        branch_id: branchId!,
        query: term.trim() || undefined,
        limit: 50,
      }),
    enabled: Boolean(businessId && branchId),
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useGoodsReceiptDetailQuery(
  goodsReceiptId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.goodsReceiptDetail(
      goodsReceiptId,
      businessId,
      branchId,
    ),
    queryFn: () =>
      getGoodsReceiptDetail(goodsReceiptId!, {
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(goodsReceiptId && businessId && branchId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useCreateGoodsReceiptMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGoodsReceipt,
    onSuccess: async () => {
      await invalidatePurchasingData(queryClient, businessId, branchId);
    },
  });
}
