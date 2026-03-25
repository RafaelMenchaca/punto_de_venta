"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  createInventoryProduct,
  createStockAdjustment,
  deactivateInventoryProduct,
  getDefaultInventoryLocation,
  getProductStock,
} from "./api";

export function useDefaultInventoryLocation(
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.defaultInventoryLocation(businessId, branchId),
    queryFn: () =>
      getDefaultInventoryLocation({
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(businessId && branchId),
  });
}

export function useCreateInventoryProductMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.defaultInventoryLocation(businessId, branchId),
      });
    },
  });
}

export function useDeactivateInventoryProductMutation(
  productId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { business_id: string }) =>
      deactivateInventoryProduct(productId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.defaultInventoryLocation(businessId, branchId),
      });
    },
  });
}

export function useProductStock(
  productId: string | null,
  businessId: string | null,
  branchId: string | null,
  locationId?: string | null,
) {
  return useQuery({
    queryKey: queryKeys.productStock(
      productId,
      businessId,
      branchId,
      locationId ?? null,
    ),
    queryFn: () =>
      getProductStock(productId!, {
        business_id: businessId!,
        branch_id: branchId!,
        location_id: locationId ?? undefined,
      }),
    enabled: Boolean(productId && businessId && branchId),
  });
}

export function useCreateStockAdjustmentMutation(
  productId: string | null,
  businessId: string | null,
  branchId: string | null,
  locationId?: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockAdjustment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.productStock(
          productId,
          businessId,
          branchId,
          locationId ?? null,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
    },
  });
}
