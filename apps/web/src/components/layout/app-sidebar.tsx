"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/config/navigation";
import { useOperatingContext } from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import {
  canAccessCash,
  canAccessPos,
  canAccessReports,
  canReadInventory,
  canReadPurchasing,
} from "@/lib/authz";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const role = contextQuery.data?.user.role ?? null;
  const visibleItems = navigationItems.filter((item) => {
    switch (item.access) {
      case "pos":
        return canAccessPos(role);
      case "inventory":
        return canReadInventory(role);
      case "purchasing":
        return canReadPurchasing(role);
      case "cash":
        return canAccessCash(role);
      case "reports":
        return canAccessReports(role);
      default:
        return true;
    }
  });

  return (
    <aside className="w-full max-w-80 rounded-[1.9rem] border border-white/70 bg-white/78 p-4 shadow-[0_20px_54px_rgba(23,23,23,0.08)] backdrop-blur-sm md:sticky md:top-6 md:h-[calc(100vh-3rem)]">
      <div className="rounded-[1.5rem] border border-white/70 bg-white/76 px-4 py-5 shadow-[0_12px_26px_rgba(23,23,23,0.04)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Punto de Venta
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {contextQuery.data?.business?.name ?? "Operacion diaria"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {contextQuery.data?.branch?.name ?? "Sucursal actual"}
        </p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {contextQuery.data?.user.role?.replaceAll("_", " ") ?? "rol pendiente"}
        </p>
      </div>

      <nav className="mt-5 space-y-2">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-start gap-3 rounded-[1.35rem] px-4 py-3.5 text-sm transition",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_14px_26px_rgba(15,118,110,0.18)]"
                  : "border border-transparent text-muted-foreground hover:border-white/70 hover:bg-white/82 hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                  active
                    ? "bg-white/15 text-primary-foreground"
                    : "bg-muted/60 text-foreground group-hover:bg-white",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold tracking-tight">{item.label}</p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-5",
                    active ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
