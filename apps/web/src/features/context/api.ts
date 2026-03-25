import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { OperatingContextResponse } from "./types";

export const getOperatingContext = (params: {
  business_id: string;
  branch_id: string;
  register_id?: string;
}) =>
  apiRequest<OperatingContextResponse>(apiEndpoints.operatingContext, {
    query: params,
  });
