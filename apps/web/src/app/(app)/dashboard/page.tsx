"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOperatingContext } from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";

export default function DashboardPage() {
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const context = contextQuery.data;
  const sessionLabel = context?.open_cash_session
    ? `Caja abierta desde ${new Date(
        context.open_cash_session.openedAt,
      ).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Sin sesion activa";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Base operativa lista</CardTitle>
          <CardDescription>
            La app web ya separa caja, POS e inventario sobre un backend NestJS.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link
            href="/cash"
            className="rounded-2xl border border-border bg-white/60 p-4 transition-colors hover:bg-white/90"
          >
            <p className="text-sm font-semibold">Caja</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Apertura, estado actual y cierre del turno.
            </p>
          </Link>
          <Link
            href="/pos"
            className="rounded-2xl border border-border bg-white/60 p-4 transition-colors hover:bg-white/90"
          >
            <p className="text-sm font-semibold">POS</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Busqueda de productos, carrito y cobro.
            </p>
          </Link>
          <Link
            href="/inventory"
            className="rounded-2xl border border-border bg-white/60 p-4 transition-colors hover:bg-white/90"
          >
            <p className="text-sm font-semibold">Inventario</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Alta de productos, stock y ajustes manuales.
            </p>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen rapido</CardTitle>
          <CardDescription>
            Estado actual del usuario, negocio, sucursal y caja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Usuario
            </p>
            <p className="mt-2 font-medium">
              {context?.user.full_name ?? "No resuelto"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Negocio
            </p>
            <p className="mt-2 font-medium">
              {context?.business.name ?? "No configurado"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Sucursal
            </p>
            <p className="mt-2 font-medium">
              {context?.branch.name ?? "No configurada"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Caja
            </p>
            <p className="mt-2 font-medium">
              {context?.register?.name ?? "No configurada"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Estado de caja
            </p>
            <p className="mt-2 font-medium">{sessionLabel}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
