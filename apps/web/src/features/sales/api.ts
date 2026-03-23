import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { CreateSalePayload } from "./types";

export const createSale = (payload: CreateSalePayload) =>
  apiRequest<{
    sale: { id: string; total: number };
    items: Array<{ id: string }>;
    payments: Array<{ id: string }>;
  }>(apiEndpoints.createSale, {
    method: "POST",
    body: payload,
  });
