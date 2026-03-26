import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  ContextBranchOption,
  ContextBusinessOption,
  ContextRegisterOption,
  OperatingContextResponse,
} from "./types";

export const getOperatingContext = (params?: {
  business_id?: string;
  branch_id?: string;
  register_id?: string;
}) =>
  apiRequest<OperatingContextResponse>(apiEndpoints.operatingContext, {
    query: params,
  });

export const getAccessibleBusinesses = () =>
  apiRequest<ContextBusinessOption[]>(apiEndpoints.contextBusinesses);

export const getAccessibleBranches = (params: { business_id: string }) =>
  apiRequest<ContextBranchOption[]>(apiEndpoints.contextBranches, {
    query: params,
  });

export const getAccessibleRegisters = (params: {
  business_id: string;
  branch_id: string;
}) =>
  apiRequest<ContextRegisterOption[]>(apiEndpoints.contextRegisters, {
    query: params,
  });
