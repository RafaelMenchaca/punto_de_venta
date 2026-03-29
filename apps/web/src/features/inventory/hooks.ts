"use client";

import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  createInventoryBrand,
  createInventoryCategory,
  createInventoryEntry,
  createInventoryLocation,
  createInventoryProduct,
  createInventorySupplier,
  createInventoryTaxRate,
  createInventoryTransfer,
  createStockAdjustment,
  deactivateInventoryLocation,
  deactivateInventoryProduct,
  dismissInventoryAlert,
  getDefaultInventoryLocation,
  getInventoryCatalogs,
  getInventoryProductDetail,
  getInventoryProductMovements,
  getProductStock,
  listInventoryAlerts,
  listInventoryLocations,
  listInventoryMovements,
  listInventoryProducts,
  reactivateInventoryLocation,
  reactivateInventoryProduct,
  resolveInventoryAlert,
  updateInventoryLocation,
  updateInventoryProduct,
} from "./api";

const invalidateInventoryData = async (
  queryClient: QueryClient,
  businessId: string | null,
  branchId: string | null,
) => {
  await queryClient.invalidateQueries({
    queryKey: ["inventory"],
  });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.inventoryCatalogs(businessId, branchId),
  });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.defaultInventoryLocation(businessId, branchId),
  });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.inventoryLocations(businessId, branchId, true),
  });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.inventoryLocations(businessId, branchId, false),
  });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.inventoryAlerts(businessId, branchId, "active"),
  });
};

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

export function useInventoryLocationsQuery(
  businessId: string | null,
  branchId: string | null,
  includeInactive = true,
) {
  return useQuery({
    queryKey: queryKeys.inventoryLocations(
      businessId,
      branchId,
      includeInactive,
    ),
    queryFn: () =>
      listInventoryLocations({
        business_id: businessId!,
        branch_id: branchId!,
        include_inactive: includeInactive,
      }),
    enabled: Boolean(businessId && branchId),
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryProductsQuery(
  businessId: string | null,
  branchId: string | null,
  term: string,
  includeInactive = true,
) {
  return useQuery({
    queryKey: queryKeys.inventoryProductsList(
      businessId,
      branchId,
      term,
      includeInactive,
    ),
    queryFn: () =>
      listInventoryProducts({
        business_id: businessId!,
        branch_id: branchId!,
        query: term.trim() || undefined,
        include_inactive: includeInactive,
      }),
    enabled: Boolean(businessId && branchId),
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryProductDetailQuery(
  productId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.inventoryProductDetail(productId, businessId, branchId),
    queryFn: () =>
      getInventoryProductDetail(productId!, {
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(productId && businessId && branchId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryProductMovementsQuery(
  productId: string | null,
  businessId: string | null,
  branchId: string | null,
  limit = 20,
) {
  return useQuery({
    queryKey: queryKeys.inventoryProductMovements(
      productId,
      businessId,
      branchId,
      limit,
    ),
    queryFn: () =>
      getInventoryProductMovements(productId!, {
        business_id: businessId!,
        branch_id: branchId!,
        limit,
      }),
    enabled: Boolean(productId && businessId && branchId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryMovementsQuery(
  businessId: string | null,
  branchId: string | null,
  filters: {
    productId?: string | null;
    locationId?: string | null;
    movementType?: string | null;
    limit?: number;
  },
) {
  return useQuery({
    queryKey: queryKeys.inventoryMovements(
      businessId,
      branchId,
      filters.productId ?? null,
      filters.locationId ?? null,
      filters.movementType ?? null,
      filters.limit ?? 50,
    ),
    queryFn: () =>
      listInventoryMovements({
        business_id: businessId!,
        branch_id: branchId!,
        product_id: filters.productId ?? undefined,
        location_id: filters.locationId ?? undefined,
        movement_type: filters.movementType ?? undefined,
        limit: filters.limit ?? 50,
      }),
    enabled: Boolean(businessId && branchId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryCatalogsQuery(
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.inventoryCatalogs(businessId, branchId),
    queryFn: () =>
      getInventoryCatalogs({
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(businessId && branchId),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryAlertsQuery(
  businessId: string | null,
  branchId: string | null,
  status = "active",
) {
  return useQuery({
    queryKey: queryKeys.inventoryAlerts(businessId, branchId, status),
    queryFn: () =>
      listInventoryAlerts({
        business_id: businessId!,
        branch_id: branchId!,
        status,
      }),
    enabled: Boolean(businessId && branchId),
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
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
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useUpdateInventoryProductMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: Parameters<typeof updateInventoryProduct>[1];
    }) => updateInventoryProduct(productId, payload),
    onSuccess: async (_response, variables) => {
      await invalidateInventoryData(queryClient, businessId, branchId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryProductDetail(
          variables.productId,
          businessId,
          branchId,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryProductMovements(
          variables.productId,
          businessId,
          branchId,
          20,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.productStock(
          variables.productId,
          businessId,
          branchId,
          null,
        ),
      });
    },
  });
}

export function useDeactivateInventoryProductMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: { business_id: string };
    }) => deactivateInventoryProduct(productId, payload),
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useReactivateInventoryProductMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: { business_id: string };
    }) => reactivateInventoryProduct(productId, payload),
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useCreateInventoryLocationMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryLocation,
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useUpdateInventoryLocationMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      locationId: string;
      payload: Parameters<typeof updateInventoryLocation>[1];
    }) => updateInventoryLocation(locationId, payload),
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useDeactivateInventoryLocationMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      locationId: string;
      payload: Parameters<typeof deactivateInventoryLocation>[1];
    }) => deactivateInventoryLocation(locationId, payload),
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useReactivateInventoryLocationMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      locationId: string;
      payload: Parameters<typeof reactivateInventoryLocation>[1];
    }) => reactivateInventoryLocation(locationId, payload),
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
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
    retry: 1,
    refetchOnWindowFocus: false,
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
        queryKey: queryKeys.inventoryProductMovements(
          productId,
          businessId,
          branchId,
          20,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryMovements(
          businessId,
          branchId,
          productId,
          null,
          null,
          50,
        ),
      });
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useCreateInventoryTransferMutation(
  businessId: string | null,
  branchId: string | null,
  productId?: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryTransfer,
    onSuccess: async () => {
      if (productId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.inventoryProductMovements(
            productId,
            businessId,
            branchId,
            20,
          ),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.productStock(
            productId,
            businessId,
            branchId,
            null,
          ),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryMovements(
          businessId,
          branchId,
          null,
          null,
          null,
          50,
        ),
      });
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useCreateInventoryEntryMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryEntry,
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useResolveInventoryAlertMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertId,
      payload,
    }: {
      alertId: string;
      payload: Parameters<typeof resolveInventoryAlert>[1];
    }) => resolveInventoryAlert(alertId, payload),
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useDismissInventoryAlertMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertId,
      payload,
    }: {
      alertId: string;
      payload: Parameters<typeof dismissInventoryAlert>[1];
    }) => dismissInventoryAlert(alertId, payload),
    onSuccess: async () => {
      await invalidateInventoryData(queryClient, businessId, branchId);
    },
  });
}

export function useCreateInventoryCategoryMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryCatalogs(businessId, branchId),
      });
    },
  });
}

export function useCreateInventoryBrandMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryBrand,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryCatalogs(businessId, branchId),
      });
    },
  });
}

export function useCreateInventoryTaxRateMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryTaxRate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryCatalogs(businessId, branchId),
      });
    },
  });
}

export function useCreateInventorySupplierMutation(
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventorySupplier,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryCatalogs(businessId, branchId),
      });
    },
  });
}
