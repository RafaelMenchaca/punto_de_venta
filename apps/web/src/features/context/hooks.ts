"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getOperatingContext } from "./api";

export function useOperatingContext(
  businessId: string | null,
  branchId: string | null,
  registerId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.operatingContext(businessId, branchId, registerId),
    queryFn: () =>
      getOperatingContext({
        business_id: businessId!,
        branch_id: branchId!,
        register_id: registerId ?? undefined,
      }),
    enabled: Boolean(businessId && branchId),
  });
}
