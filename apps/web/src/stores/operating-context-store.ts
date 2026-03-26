"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clientEnv } from "@/lib/env/client";

interface OperatingContextState {
  business_id: string;
  branch_id: string;
  register_id: string;
  setBusinessId: (businessId: string) => void;
  setBranchId: (branchId: string) => void;
  setRegisterId: (registerId: string) => void;
  clearSelection: () => void;
}

const getInitialSelection = () => ({
  business_id: clientEnv.enableDevAuthBypass ? clientEnv.devBusinessId : "",
  branch_id: clientEnv.enableDevAuthBypass ? clientEnv.devBranchId : "",
  register_id: clientEnv.enableDevAuthBypass ? clientEnv.devRegisterId : "",
});

export const useOperatingContextStore = create<OperatingContextState>()(
  persist(
    (set) => ({
      ...getInitialSelection(),
      setBusinessId: (business_id) =>
        set({
          business_id,
          branch_id: "",
          register_id: "",
        }),
      setBranchId: (branch_id) =>
        set({
          branch_id,
          register_id: "",
        }),
      setRegisterId: (register_id) => set({ register_id }),
      clearSelection: () => set(getInitialSelection()),
    }),
    {
      name: "operating-context",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        business_id: state.business_id,
        branch_id: state.branch_id,
        register_id: state.register_id,
      }),
    },
  ),
);
