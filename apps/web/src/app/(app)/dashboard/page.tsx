"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOpenCashSessionQuery } from "@/features/cash/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";

export default function DashboardPage() {
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const { data: openSession } = useOpenCashSessionQuery(
    register_id,
    business_id,
    branch_id,
  );

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
              Búsqueda de productos, carrito y cobro.
            </p>
          </Link>
          <Link
            href="/inventory"
            className="rounded-2xl border border-border bg-white/60 p-4 transition-colors hover:bg-white/90"
          >
            <p className="text-sm font-semibold">Inventario</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Consulta de stock y ajustes manuales.
            </p>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen rápido</CardTitle>
          <CardDescription>
            Estado mínimo del contexto para la fase actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Negocio
            </p>
            <p className="mt-2 font-medium">
              {business_id ?? "No configurado"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Sucursal
            </p>
            <p className="mt-2 font-medium">{branch_id ?? "No configurada"}</p>
          </div>
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Caja
            </p>
            <p className="mt-2 font-medium">
              {register_id ?? "No configurada"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Sesión abierta
            </p>
            <p className="mt-2 font-medium">
              {openSession ? openSession.id.slice(0, 8) : "Sin sesión activa"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
