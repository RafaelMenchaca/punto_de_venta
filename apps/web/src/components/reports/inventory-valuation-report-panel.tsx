"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { useInventoryValuationReportQuery } from "@/features/reports/hooks";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { formatCurrency } from "@/lib/utils";

export function InventoryValuationReportPanel({
  businessId,
  branchId,
}: {
  businessId: string;
  branchId: string;
}) {
  const reportQuery = useInventoryValuationReportQuery({
    businessId,
    branchId,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventario valorizado</CardTitle>
          <CardDescription>
            Foto operativa del stock actual por costo base en la sucursal
            seleccionada.
          </CardDescription>
        </CardHeader>
      </Card>

      {reportQuery.error && !reportQuery.data ? (
        <ErrorState
          message={getFriendlyErrorMessage(
            reportQuery.error,
            "No se pudo cargar el reporte de inventario.",
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
        <LoadingState message="Cargando valorizacion de inventario..." />
      ) : null}

      {reportQuery.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Productos"
              value={String(reportQuery.data.summary.itemsCount)}
            />
            <MetricCard
              label="Valor total"
              value={formatCurrency(reportQuery.data.summary.totalStockValue)}
            />
            <MetricCard label="Alcance" value="Sucursal actual" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Productos valorizados</CardTitle>
              <CardDescription>
                Stock disponible multiplicado por costo base actual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportQuery.data.items.length === 0 ? (
                <EmptyState
                  title="Sin inventario valorizado"
                  description="No hay productos con stock disponible en este momento."
                />
              ) : null}

              {reportQuery.data.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-white/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        SKU: {item.sku ?? "sin SKU"}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.estimatedValue)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <MiniMetric label="Stock" value={String(item.stockTotal)} />
                    <MiniMetric
                      label="Costo"
                      value={formatCurrency(item.unitCost)}
                    />
                    <MiniMetric
                      label="Valor"
                      value={formatCurrency(item.estimatedValue)}
                    />
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
