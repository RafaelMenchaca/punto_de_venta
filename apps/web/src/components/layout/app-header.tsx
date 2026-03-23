"use client";

import { Badge } from "@/components/ui/badge";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useCurrentUser } from "@/hooks/use-current-user";

export function AppHeader() {
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const user = useCurrentUser();

  return (
    <header className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-[0_18px_48px_rgba(23,23,23,0.08)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Contexto operativo
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Frontend web preparado para caja, ventas e inventario
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="default">
            Usuario: {user.id ? user.id.slice(0, 8) : "pendiente"}
          </Badge>
          <Badge variant="warning">
            Negocio: {business_id ? business_id.slice(0, 8) : "pendiente"}
          </Badge>
          <Badge variant="default">
            Sucursal: {branch_id ? branch_id.slice(0, 8) : "pendiente"}
          </Badge>
          <Badge variant="success">
            Caja: {register_id ? register_id.slice(0, 8) : "pendiente"}
          </Badge>
        </div>
      </div>
    </header>
  );
}
