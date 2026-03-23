import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
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
