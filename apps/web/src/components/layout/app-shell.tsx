"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname === "/dashboard";

  return (
    <div className="mx-auto flex min-h-screen max-w-[1560px] flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row lg:items-start">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {showHeader ? <AppHeader /> : null}
        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
