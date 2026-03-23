"use client";

import { createContext, ReactNode, useContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseContext.Provider value={getBrowserSupabaseClient()}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseClient() {
  return useContext(SupabaseContext);
}
