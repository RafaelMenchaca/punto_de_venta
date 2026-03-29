"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomer, listCustomers } from "./api";

export function useCustomersQuery(
  businessId: string | null,
  query: string,
  limit = 8,
) {
  return useQuery({
    queryKey: ["customers", businessId, query.trim(), limit],
    queryFn: () =>
      listCustomers({
        business_id: businessId!,
        query: query.trim() || undefined,
        limit,
      }),
    enabled: Boolean(businessId),
    staleTime: 30_000,
  });
}

export function useCreateCustomerMutation(businessId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["customers", businessId],
      });
    },
  });
}
