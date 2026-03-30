"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { useSalesReportQuery } from "@/features/reports/hooks";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { formatCurrency } from "@/lib/utils";

const createDefaultDateFrom = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
};

export function SalesReportPanel({
  businessId,
  branchId,
  registerId,
}: {
  businessId: string;
  branchId: string;
  registerId: string;
}) {
  const [scope, setScope] = useState<"branch" | "register">("branch");
  const [dateFrom, setDateFrom] = useState(createDefaultDateFrom);
  const [dateTo, setDateTo] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const reportQuery = useSalesReportQuery({
    businessId,
    branchId,
    registerId: scope === "register" ? registerId : null,
    dateFrom,
    dateTo,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporte de ventas</CardTitle>
          <CardDescription>
            Consulta ventas por periodo con resumen por estado y metodo de pago.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Alcance</label>
            <select
              className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm"
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as "branch" | "register")
              }
            >
              <option value="branch">Sucursal actual</option>
              <option value="register">Caja actual</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Desde</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Hasta</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm text-muted-foreground">
            {scope === "register"
              ? "Mostrando solo la caja actual."
              : "Mostrando la sucursal actual completa."}
          </div>
        </CardContent>
      </Card>

      {reportQuery.error && !reportQuery.data ? (
        <ErrorState
          message={getFriendlyErrorMessage(
            reportQuery.error,
            "No se pudo cargar el reporte de ventas.",
          )}
          actionLabel="Reintentar"
          onAction={() => void reportQuery.refetch()}
        />
      ) : null}

      {reportQuery.error && reportQuery.data ? (
        <NoticeBanner
          message="No se pudo actualizar el reporte en este momento."
          actionLabel="Intenta nuevamente"
          onAction={() => void reportQuery.refetch()}
        />
      ) : null}

      {reportQuery.isLoading && !reportQuery.data ? (
        <LoadingState message="Cargando reporte de ventas..." />
      ) : null}

      {reportQuery.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total vendido"
              value={formatCurrency(reportQuery.data.summary.totalSales)}
            />
            <MetricCard
              label="Ventas"
              value={String(reportQuery.data.summary.salesCount)}
            />
            <MetricCard
              label="Ticket promedio"
              value={formatCurrency(reportQuery.data.summary.averageTicket)}
            />
            <MetricCard
              label="Efectivo"
              value={formatCurrency(reportQuery.data.summary.paymentTotals.cash)}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Desglose</CardTitle>
                <CardDescription>
                  Estados de venta y metodos de pago del periodo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  {reportQuery.data.summary.salesByStatus.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-2xl border border-border bg-white/60 p-4"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {item.status.replaceAll("_", " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} ventas
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniMetric
                    label="Tarjeta"
                    value={formatCurrency(
                      reportQuery.data.summary.paymentTotals.card,
                    )}
                  />
                  <MiniMetric
                    label="Transferencia"
                    value={formatCurrency(
                      reportQuery.data.summary.paymentTotals.transfer,
                    )}
                  />
                  <MiniMetric
                    label="Mixto"
                    value={formatCurrency(
                      reportQuery.data.summary.paymentTotals.mixed,
                    )}
                  />
                  <MiniMetric
                    label="Credito tienda"
                    value={formatCurrency(
                      reportQuery.data.summary.paymentTotals.store_credit,
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas del periodo</CardTitle>
                <CardDescription>
                  Lista resumida de ventas recientes del reporte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportQuery.data.items.length === 0 ? (
                  <EmptyState
                    title="Sin ventas"
                    description="No hay ventas en el rango seleccionado."
                  />
                ) : null}

                {reportQuery.data.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-white/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.folio}</p>
                          <Badge>
                            {item.status.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.paymentMethodLabel}
                          {" | "}
                          {new Date(item.createdAt).toLocaleString("es-MX")}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Cliente: {item.customerName ?? "Venta general"}
                          {" | "}
                          Cajero: {item.cashierName ?? "Sin usuario"}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
