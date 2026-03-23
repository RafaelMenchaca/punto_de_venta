"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clientEnv } from "@/lib/env/client";

interface CashState {
  register_id: string;
  setRegisterId: (registerId: string) => void;
}

export const useCashStore = create<CashState>()(
  persist(
    (set) => ({
      register_id: clientEnv.devRegisterId,
      setRegisterId: (register_id) => set({ register_id }),
    }),
    {
      name: "cash-context",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
