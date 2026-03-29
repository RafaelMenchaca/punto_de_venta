import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { CreateCustomerPayload, CustomerRecord } from "./types";

export const listCustomers = (params: {
  business_id: string;
  query?: string;
  limit?: number;
}) =>
  apiRequest<CustomerRecord[]>(apiEndpoints.customers, {
    query: params,
  });

export const createCustomer = (payload: CreateCustomerPayload) =>
  apiRequest<CustomerRecord>(apiEndpoints.customers, {
    method: "POST",
    body: payload,
  });
