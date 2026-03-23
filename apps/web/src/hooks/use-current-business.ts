"use client";

import { clientEnv } from "@/lib/env/client";
import { useCashStore } from "@/stores/cash-store";

export function useCurrentBusiness() {
  const register_id = useCashStore((state) => state.register_id);
  const setRegisterId = useCashStore((state) => state.setRegisterId);

  return {
    business_id: clientEnv.devBusinessId || null,
    branch_id: clientEnv.devBranchId || null,
    register_id: register_id || clientEnv.devRegisterId || null,
    setRegisterId,
  };
}
