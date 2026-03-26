"use client";

import { useOperatingContextStore } from "@/stores/operating-context-store";

export function useCurrentBusiness() {
  const business_id = useOperatingContextStore((state) => state.business_id);
  const branch_id = useOperatingContextStore((state) => state.branch_id);
  const register_id = useOperatingContextStore((state) => state.register_id);
  const setBusinessId = useOperatingContextStore((state) => state.setBusinessId);
  const setBranchId = useOperatingContextStore((state) => state.setBranchId);
  const setRegisterId = useOperatingContextStore((state) => state.setRegisterId);
  const clearSelection = useOperatingContextStore((state) => state.clearSelection);

  return {
    business_id: business_id || null,
    branch_id: branch_id || null,
    register_id: register_id || null,
    setBusinessId,
    setBranchId,
    setRegisterId,
    clearSelection,
  };
}
