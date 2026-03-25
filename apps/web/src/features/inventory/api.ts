import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CreateInventoryProductPayload,
  DeactivateInventoryProductPayload,
  InventoryLocation,
  ProductStock,
  StockAdjustmentPayload,
} from "./types";

export const getDefaultInventoryLocation = (params: {
  business_id: string;
  branch_id: string;
}) =>
  apiRequest<InventoryLocation>(apiEndpoints.inventoryDefaultLocation, {
    query: params,
  });

export const createInventoryProduct = (payload: CreateInventoryProductPayload) =>
  apiRequest<{
    product_id: string;
    name: string;
    sku: string;
    initial_stock: number;
  }>(apiEndpoints.inventoryCreateProduct, {
    method: "POST",
    body: payload,
  });

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
