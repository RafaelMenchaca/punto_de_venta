"use client";

import { Badge } from "@/components/ui/badge";
import { useOperatingContext } from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";

export function AppHeader() {
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const context = contextQuery.data;

  return (
    <header className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-[0_18px_48px_rgba(23,23,23,0.08)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Contexto operativo
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {context?.business.name ?? "Punto de venta"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {context?.branch.name ?? "Sucursal sin resolver"}
            {context?.register
              ? ` | ${context.register.name ?? "Caja"} (${context.register.code ?? "sin codigo"})`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="default">
            Usuario: {context?.user.full_name ?? "pendiente"}
          </Badge>
          <Badge variant="warning">
            Negocio: {context?.business.name ?? "pendiente"}
          </Badge>
          <Badge variant="default">
            Sucursal: {context?.branch.name ?? "pendiente"}
          </Badge>
          <Badge variant="success">
            Caja: {context?.register?.name ?? "pendiente"}
          </Badge>
        </div>
      </div>
    </header>
  );
}
