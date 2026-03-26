"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { SupabaseProvider } from "./supabase-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
}
