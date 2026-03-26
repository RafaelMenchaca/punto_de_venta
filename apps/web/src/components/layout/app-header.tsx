"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOperatingContext } from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useAuth } from "@/providers/auth-provider";
import { OperatingSelector } from "./operating-selector";

export function AppHeader() {
  const { business_id, branch_id, register_id, clearSelection } =
    useCurrentBusiness();
  const { signOut, source } = useAuth();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const context = contextQuery.data;

  return (
    <header className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-[0_18px_48px_rgba(23,23,23,0.08)] backdrop-blur">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Contexto operativo
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {context?.business?.name ?? "Seleccion operativa pendiente"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {context?.branch?.name ?? "Selecciona negocio y sucursal"}
              {context?.register
                ? ` | ${context.register.name ?? "Caja"} (${context.register.code ?? "sin codigo"})`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="default">
              Usuario: {context?.user.full_name ?? "pendiente"}
            </Badge>
            <Badge variant="warning">
              Negocio: {context?.business?.name ?? "sin seleccionar"}
            </Badge>
            <Badge variant="default">
              Sucursal: {context?.branch?.name ?? "sin seleccionar"}
            </Badge>
            <Badge variant="success">
              Caja: {context?.register?.name ?? "sin seleccionar"}
            </Badge>
            <Badge variant="destructive">
              Auth:{" "}
              {source === "supabase"
                ? "real"
                : source === "dev"
                  ? "dev"
                  : "sin sesion"}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  clearSelection();
                  await signOut();
                  toast.success("Sesion cerrada.");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "No fue posible cerrar la sesion.",
                  );
                }
              }}
            >
              Cerrar sesion
            </Button>
          </div>
        </div>

        <OperatingSelector />
      </div>
    </header>
  );
}
