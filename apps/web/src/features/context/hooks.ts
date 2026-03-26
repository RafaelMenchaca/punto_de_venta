"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  getAccessibleBranches,
  getAccessibleBusinesses,
  getAccessibleRegisters,
  getOperatingContext,
} from "./api";

export function useOperatingContext(
  businessId: string | null,
  branchId: string | null,
  registerId: string | null,
) {
  const normalizedBusinessId = businessId ?? null;
  const normalizedBranchId = normalizedBusinessId ? branchId ?? null : null;
  const normalizedRegisterId =
    normalizedBusinessId && normalizedBranchId ? registerId ?? null : null;

  return useQuery({
    queryKey: queryKeys.operatingContext(
      normalizedBusinessId,
      normalizedBranchId,
      normalizedRegisterId,
    ),
    queryFn: () =>
      getOperatingContext({
        business_id: normalizedBusinessId ?? undefined,
        branch_id: normalizedBranchId ?? undefined,
        register_id: normalizedRegisterId ?? undefined,
      }),
  });
}

export function useAccessibleBusinesses() {
  return useQuery({
    queryKey: queryKeys.contextBusinesses(),
    queryFn: () => getAccessibleBusinesses(),
  });
}

export function useAccessibleBranches(businessId: string | null) {
  return useQuery({
    queryKey: queryKeys.contextBranches(businessId),
    queryFn: () =>
      getAccessibleBranches({
        business_id: businessId!,
      }),
    enabled: Boolean(businessId),
  });
}

export function useAccessibleRegisters(
  businessId: string | null,
  branchId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.contextRegisters(businessId, branchId),
    queryFn: () =>
      getAccessibleRegisters({
        business_id: businessId!,
        branch_id: branchId!,
      }),
    enabled: Boolean(businessId && branchId),
  });
}
