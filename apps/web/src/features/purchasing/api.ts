import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CreateGoodsReceiptPayload,
  CreatePurchaseOrderPayload,
  CreateSupplierPayload,
  GoodsReceiptDetail,
  GoodsReceiptListItem,
  PurchaseOrderDetail,
  PurchaseOrderListItem,
  PurchasingSupplier,
  UpdatePurchaseOrderPayload,
  UpdateSupplierPayload,
} from "./types";

export const listPurchasingSuppliers = (params: {
  business_id: string;
  query?: string;
  include_inactive?: boolean;
}) =>
  apiRequest<PurchasingSupplier[]>(apiEndpoints.purchasingSuppliers, {
    query: params,
  });

export const getPurchasingSupplierDetail = (
  supplierId: string,
  params: { business_id: string },
) =>
  apiRequest<PurchasingSupplier>(
    apiEndpoints.purchasingSupplierDetail(supplierId),
    {
      query: params,
    },
  );

export const createPurchasingSupplier = (payload: CreateSupplierPayload) =>
  apiRequest<PurchasingSupplier>(apiEndpoints.purchasingSuppliers, {
    method: "POST",
    body: payload,
  });

export const updatePurchasingSupplier = (
  supplierId: string,
  payload: UpdateSupplierPayload,
) =>
  apiRequest<PurchasingSupplier>(
    apiEndpoints.purchasingSupplierDetail(supplierId),
    {
      method: "PATCH",
      body: payload,
    },
  );

export const deactivatePurchasingSupplier = (
  supplierId: string,
  payload: { business_id: string },
) =>
  apiRequest<PurchasingSupplier>(
    apiEndpoints.purchasingSupplierDeactivate(supplierId),
    {
      method: "POST",
      body: payload,
    },
  );

export const reactivatePurchasingSupplier = (
  supplierId: string,
  payload: { business_id: string },
) =>
  apiRequest<PurchasingSupplier>(
    apiEndpoints.purchasingSupplierReactivate(supplierId),
    {
      method: "POST",
      body: payload,
    },
  );

export const listPurchaseOrders = (params: {
  business_id: string;
  branch_id: string;
  query?: string;
  limit?: number;
  status?: string;
}) =>
  apiRequest<PurchaseOrderListItem[]>(apiEndpoints.purchaseOrders, {
    query: params,
  });

export const getPurchaseOrderDetail = (
  purchaseOrderId: string,
  params: {
    business_id: string;
    branch_id: string;
  },
) =>
  apiRequest<PurchaseOrderDetail>(
    apiEndpoints.purchaseOrderDetail(purchaseOrderId),
    {
      query: params,
    },
  );

export const createPurchaseOrder = (payload: CreatePurchaseOrderPayload) =>
  apiRequest<PurchaseOrderDetail>(apiEndpoints.purchaseOrders, {
    method: "POST",
    body: payload,
  });

export const updatePurchaseOrder = (
  purchaseOrderId: string,
  payload: UpdatePurchaseOrderPayload,
) =>
  apiRequest<PurchaseOrderDetail>(
    apiEndpoints.purchaseOrderDetail(purchaseOrderId),
    {
      method: "PATCH",
      body: payload,
    },
  );

export const submitPurchaseOrder = (
  purchaseOrderId: string,
  payload: { business_id: string; branch_id: string },
) =>
  apiRequest<PurchaseOrderDetail>(
    apiEndpoints.purchaseOrderSubmit(purchaseOrderId),
    {
      method: "POST",
      body: payload,
    },
  );

export const cancelPurchaseOrder = (
  purchaseOrderId: string,
  payload: { business_id: string; branch_id: string },
) =>
  apiRequest<PurchaseOrderDetail>(
    apiEndpoints.purchaseOrderCancel(purchaseOrderId),
    {
      method: "POST",
      body: payload,
    },
  );

export const listGoodsReceipts = (params: {
  business_id: string;
  branch_id: string;
  query?: string;
  limit?: number;
}) =>
  apiRequest<GoodsReceiptListItem[]>(apiEndpoints.goodsReceipts, {
    query: params,
  });

export const getGoodsReceiptDetail = (
  goodsReceiptId: string,
  params: {
    business_id: string;
    branch_id: string;
  },
) =>
  apiRequest<GoodsReceiptDetail>(
    apiEndpoints.goodsReceiptDetail(goodsReceiptId),
    {
      query: params,
    },
  );

export const createGoodsReceipt = (payload: CreateGoodsReceiptPayload) =>
  apiRequest<GoodsReceiptDetail>(apiEndpoints.goodsReceipts, {
    method: "POST",
    body: payload,
  });
