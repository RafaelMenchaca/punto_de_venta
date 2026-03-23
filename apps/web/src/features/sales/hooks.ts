"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { createSale } from "./api";

export function useCreateSaleMutation(
  registerId: string | null,
  businessId: string | null,
  branchId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cashOpenSession(registerId, businessId, branchId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
    },
  });
}
