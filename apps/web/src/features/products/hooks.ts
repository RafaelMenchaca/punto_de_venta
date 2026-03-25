"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { searchProducts } from "./api";

export function useProductSearch(
  businessId: string | null,
  branchId: string | null,
  term: string,
  minimumLength = 2,
) {
  return useQuery({
    queryKey: queryKeys.productSearch(businessId, branchId, term),
    queryFn: () =>
      searchProducts({
        business_id: businessId!,
        branch_id: branchId!,
        query: term.trim() || undefined,
      }),
    enabled: Boolean(
      businessId && branchId && term.trim().length >= minimumLength,
    ),
  });
}
