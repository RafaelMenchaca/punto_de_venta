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
  const authLabel =
    source === "supabase" ? "Sesion real" : source === "dev" ? "Sesion dev" : "Sin sesion";
  const roleLabel = context?.user.role
    ? context.user.role.replaceAll("_", " ")
    : "sin rol";

  return (
    <header className="rounded-[1.9rem] border border-white/70 bg-white/78 p-6 shadow-[0_20px_54px_rgba(23,23,23,0.08)] backdrop-blur-sm">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Operacion diaria
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {context?.business?.name ?? "Seleccion operativa pendiente"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {context?.branch?.name ?? "Selecciona negocio y sucursal"}
              {context?.register
                ? ` | ${context.register.name ?? "Caja"} (${context.register.code ?? "sin codigo"})`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{context?.user.full_name ?? "Usuario pendiente"}</Badge>
            <Badge variant="warning">{roleLabel}</Badge>
            <Badge variant={source === "supabase" ? "success" : "destructive"}>
              {authLabel}
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
                } catch {
                  toast.error("No fue posible cerrar la sesion.");
                }
              }}
            >
              Cerrar sesion
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <ContextChip
            label="Usuario"
            value={context?.user.full_name ?? "Pendiente"}
          />
          <ContextChip
            label="Sucursal"
            value={context?.branch?.name ?? "Sin seleccionar"}
          />
          <ContextChip
            label="Caja"
            value={context?.register?.name ?? "Sin seleccionar"}
          />
          <ContextChip
            label="Sesion"
            value={
              context?.open_cash_session
                ? `Abierta desde ${new Date(context.open_cash_session.openedAt).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Sin sesion abierta"
            }
          />
        </div>

        <div className="rounded-[1.4rem] border border-white/70 bg-white/76 p-4 shadow-[0_10px_24px_rgba(23,23,23,0.04)]">
          <OperatingSelector />
        </div>
      </div>
    </header>
  );
}

function ContextChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/70 bg-white/74 p-3.5 shadow-[0_12px_24px_rgba(23,23,23,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold tracking-tight">{value}</p>
    </div>
  );
}
