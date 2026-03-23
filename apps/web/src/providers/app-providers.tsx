"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { SupabaseProvider } from "./supabase-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SupabaseProvider>
        {children}
        <Toaster richColors position="top-right" />
      </SupabaseProvider>
    </QueryProvider>
  );
}
