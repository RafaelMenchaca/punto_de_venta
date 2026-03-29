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
  createInventoryProduct,
  createInventorySupplier,
  createInventoryTaxRate,
  createStockAdjustment,
  deactivateInventoryProduct,
  getDefaultInventoryLocation,
  getInventoryCatalogs,
  getInventoryProductDetail,
  getInventoryProductMovements,
  getProductStock,
  listInventoryProducts,
  reactivateInventoryProduct,
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
  });
}

export function useInventoryProductMovementsQuery(
  productId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.inventoryProductMovements(
      productId,
      businessId,
      branchId,
    ),
    queryFn: () =>
      getInventoryProductMovements(productId!, {
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(productId && businessId && branchId),
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
        queryKey: queryKeys.inventoryProductMovements(
          productId,
          businessId,
          branchId,
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
