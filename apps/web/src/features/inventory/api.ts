import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CreateInventoryBrandPayload,
  CreateInventoryCategoryPayload,
  CreateInventoryEntryPayload,
  CreateInventoryEntryResponse,
  CreateInventoryProductPayload,
  CreateInventorySupplierPayload,
  CreateInventoryTaxRatePayload,
  DeactivateInventoryProductPayload,
  InventoryCatalogOption,
  InventoryCatalogs,
  InventoryMovement,
  InventoryProductDetail,
  InventoryProductListItem,
  InventorySupplierOption,
  InventoryTaxRateOption,
  InventoryLocation,
  ProductStock,
  StockAdjustmentPayload,
  UpdateInventoryProductPayload,
} from "./types";

export const getDefaultInventoryLocation = (params: {
  business_id: string;
  branch_id: string;
}) =>
  apiRequest<InventoryLocation>(apiEndpoints.inventoryDefaultLocation, {
    query: params,
  });

export const listInventoryProducts = (params: {
  business_id: string;
  branch_id: string;
  query?: string;
  include_inactive?: boolean;
}) =>
  apiRequest<InventoryProductListItem[]>(apiEndpoints.inventoryProductsList, {
    query: params,
  });

export const getInventoryProductDetail = (
  productId: string,
  params: {
    business_id: string;
    branch_id: string;
  },
) =>
  apiRequest<InventoryProductDetail>(
    apiEndpoints.inventoryProductDetail(productId),
    {
      query: params,
    },
  );

export const getInventoryProductMovements = (
  productId: string,
  params: {
    business_id: string;
    branch_id: string;
  },
) =>
  apiRequest<InventoryMovement[]>(
    apiEndpoints.inventoryProductMovements(productId),
    {
      query: params,
    },
  );

export const createInventoryProduct = (
  payload: CreateInventoryProductPayload,
) =>
  apiRequest<{
    product_id: string;
    name: string;
    sku: string;
    initial_stock: number;
  }>(apiEndpoints.inventoryCreateProduct, {
    method: "POST",
    body: payload,
  });

export const updateInventoryProduct = (
  productId: string,
  payload: UpdateInventoryProductPayload,
) =>
  apiRequest<InventoryProductDetail>(
    apiEndpoints.inventoryUpdateProduct(productId),
    {
      method: "POST",
      body: payload,
    },
  );

export const deactivateInventoryProduct = (
  productId: string,
  payload: DeactivateInventoryProductPayload,
) =>
  apiRequest<{
    product_id: string;
    name: string;
    is_active: boolean;
  }>(apiEndpoints.inventoryDeactivateProduct(productId), {
    method: "POST",
    body: payload,
  });

export const reactivateInventoryProduct = (
  productId: string,
  payload: DeactivateInventoryProductPayload,
) =>
  apiRequest<{
    product_id: string;
    name: string;
    is_active: boolean;
  }>(apiEndpoints.inventoryReactivateProduct(productId), {
    method: "POST",
    body: payload,
  });

export const getProductStock = (
  productId: string,
  params: {
    business_id: string;
    branch_id: string;
    location_id?: string;
  },
) =>
  apiRequest<ProductStock>(apiEndpoints.inventoryProductStock(productId), {
    query: params,
  });

export const createStockAdjustment = (payload: StockAdjustmentPayload) =>
  apiRequest<{
    product_id: string;
    previous_quantity: number;
    new_quantity: number;
    difference: number;
  }>(apiEndpoints.inventoryStockAdjustments, {
    method: "POST",
    body: payload,
  });

export const getInventoryCatalogs = (params: {
  business_id: string;
  branch_id: string;
}) =>
  apiRequest<InventoryCatalogs>(apiEndpoints.inventoryCatalogs, {
    query: params,
  });

export const createInventoryCategory = (
  payload: CreateInventoryCategoryPayload,
) =>
  apiRequest<InventoryCatalogOption>(apiEndpoints.inventoryCreateCategory, {
    method: "POST",
    body: payload,
  });

export const createInventoryBrand = (payload: CreateInventoryBrandPayload) =>
  apiRequest<InventoryCatalogOption>(apiEndpoints.inventoryCreateBrand, {
    method: "POST",
    body: payload,
  });

export const createInventoryTaxRate = (
  payload: CreateInventoryTaxRatePayload,
) =>
  apiRequest<InventoryTaxRateOption>(apiEndpoints.inventoryCreateTaxRate, {
    method: "POST",
    body: payload,
  });

export const createInventorySupplier = (
  payload: CreateInventorySupplierPayload,
) =>
  apiRequest<InventorySupplierOption>(apiEndpoints.inventoryCreateSupplier, {
    method: "POST",
    body: payload,
  });

export const createInventoryEntry = (payload: CreateInventoryEntryPayload) =>
  apiRequest<CreateInventoryEntryResponse>(apiEndpoints.inventoryEntries, {
    method: "POST",
    body: payload,
  });
