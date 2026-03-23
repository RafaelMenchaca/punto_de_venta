import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { ProductSearchResult } from "./types";

export const searchProducts = (params: {
  business_id: string;
  branch_id: string;
  query: string;
}) =>
  apiRequest<ProductSearchResult[]>(apiEndpoints.inventoryProductsSearch, {
    query: params,
  });
