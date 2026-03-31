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
import { useCashSessionsReportQuery } from "@/features/reports/hooks";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { formatCurrency } from "@/lib/utils";

const createDefaultDateFrom = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
};

export function CashSessionsReportPanel({
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

  const reportQuery = useCashSessionsReportQuery({
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
          <CardTitle>Reporte de caja</CardTitle>
          <CardDescription>
            Revisa sesiones, esperado contra contado y diferencias del periodo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Alcance</label>
            <select
              className="ui-select"
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
              ? "Analizando solo la caja actual."
              : "Analizando todas las cajas de la sucursal actual."}
          </div>
        </CardContent>
      </Card>

      {reportQuery.error && !reportQuery.data ? (
        <ErrorState
          message={getFriendlyErrorMessage(
            reportQuery.error,
            "No se pudo cargar el reporte de caja.",
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
        <LoadingState message="Cargando reporte de caja..." />
      ) : null}

      {reportQuery.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Sesiones"
              value={String(reportQuery.data.summary.sessionsCount)}
            />
            <MetricCard
              label="Ventas"
              value={formatCurrency(reportQuery.data.summary.salesTotal)}
            />
            <MetricCard
              label="Esperado"
              value={formatCurrency(reportQuery.data.summary.expectedCash)}
            />
            <MetricCard
              label="Diferencia"
              value={formatCurrency(reportQuery.data.summary.differenceAmount)}
              tone={
                reportQuery.data.summary.differenceAmount < 0
                  ? "negative"
                  : reportQuery.data.summary.differenceAmount > 0
                    ? "positive"
                    : "neutral"
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sesiones del periodo</CardTitle>
              <CardDescription>
                Apertura, cierres, movimientos y metodos de cobro por sesion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
                {reportQuery.data.items.length} sesion
                {reportQuery.data.items.length === 1 ? "" : "es"} en el rango seleccionado
              </div>
              {reportQuery.data.items.length === 0 ? (
                <EmptyState
                  title="Sin sesiones"
                  description="No hay sesiones para el rango seleccionado."
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
                        <Badge variant={item.status === "closed" ? "success" : "warning"}>
                          {item.status === "closed" ? "Cerrada" : "Abierta"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.branchName} | {item.registerName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(item.openedAt).toLocaleString("es-MX")}
                        {item.closedAt
                          ? ` -> ${new Date(item.closedAt).toLocaleString("es-MX")}`
                          : " | Sesion activa"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.salesTotal)}
                      </p>
                      <p className="text-sm text-muted-foreground">Ventas</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <MiniMetric
                      label="Apertura"
                      value={formatCurrency(item.openingAmount)}
                    />
                    <MiniMetric
                      label="Esperado"
                      value={
                        item.closingExpected !== null
                          ? formatCurrency(item.closingExpected)
                          : "Pendiente"
                      }
                    />
                    <MiniMetric
                      label="Contado"
                      value={
                        item.closingCounted !== null
                          ? formatCurrency(item.closingCounted)
                          : "Pendiente"
                      }
                    />
                    <MiniMetric
                      label="Ingreso"
                      value={formatCurrency(item.manualIncomeTotal)}
                    />
                    <MiniMetric
                      label="Retiro"
                      value={formatCurrency(item.manualExpenseTotal)}
                    />
                    <MiniMetric
                      label="Diferencia"
                      value={
                        item.differenceAmount !== null
                          ? formatCurrency(item.differenceAmount)
                          : formatCurrency(0)
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>Efectivo: {formatCurrency(item.paymentTotals.cash)}</span>
                    <span>Tarjeta: {formatCurrency(item.paymentTotals.card)}</span>
                    <span>
                      Transferencia: {formatCurrency(item.paymentTotals.transfer)}
                    </span>
                    <span>Mixto: {formatCurrency(item.paymentTotals.mixed)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-semibold ${
          tone === "positive"
            ? "text-emerald-700"
            : tone === "negative"
              ? "text-red-700"
              : ""
        }`}
      >
        {value}
      </p>
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
