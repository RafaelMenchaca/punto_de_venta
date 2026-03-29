import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CancelSaleResponse,
  CreateRefundPayload,
  CreateRefundResponse,
  CreateSalePayload,
  SaleDetailResponse,
  SaleListItem,
  SaleRefund,
} from "./types";

export const createSale = (payload: CreateSalePayload) =>
  apiRequest<SaleDetailResponse>(apiEndpoints.createSale, {
    method: "POST",
    body: payload,
  });

export const listSales = (params: {
  business_id: string;
  branch_id: string;
  query?: string;
  limit?: number;
}) =>
  apiRequest<SaleListItem[]>(apiEndpoints.salesList, {
    query: params,
  });

export const getSaleDetail = (saleId: string) =>
  apiRequest<SaleDetailResponse>(apiEndpoints.saleDetail(saleId));

export const cancelSale = (saleId: string) =>
  apiRequest<CancelSaleResponse>(apiEndpoints.saleCancel(saleId), {
    method: "POST",
  });

export const getSaleRefunds = (saleId: string) =>
  apiRequest<SaleRefund[]>(apiEndpoints.saleRefunds(saleId));

export const createRefund = (payload: CreateRefundPayload) =>
  apiRequest<CreateRefundResponse>(apiEndpoints.createRefund, {
    method: "POST",
    body: payload,
  });
