"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-72 rounded-[1.75rem] border border-white/60 bg-white/70 p-4 shadow-[0_18px_48px_rgba(23,23,23,0.08)] backdrop-blur md:sticky md:top-6 md:h-[calc(100vh-3rem)]">
      <div className="mb-8 px-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Punto de Venta
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Operación diaria
        </h1>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/80 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
