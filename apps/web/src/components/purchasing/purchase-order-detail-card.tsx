"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import type { PurchaseOrderDetail } from "@/features/purchasing/types";
import {
  formatQuantity,
  getPurchaseOrderStatusLabel,
  summarizeOrderDetail,
} from "@/features/purchasing/utils";
import { formatCurrency } from "@/lib/utils";

export function PurchaseOrderDetailCard({
  order,
  loading,
  errorMessage,
  onRetry,
  onEdit,
  onSubmit,
  onCancel,
  onReceive,
}: {
  order: PurchaseOrderDetail | null;
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  onReceive: () => void;
}) {
  if (errorMessage) {
    return (
      <ErrorState
        message={errorMessage}
        actionLabel="Reintentar"
        onAction={onRetry}
      />
    );
  }

  if (loading) {
    return <LoadingState message="Cargando detalle de orden..." />;
  }

  if (!order) {
    return (
      <EmptyState
        title="Selecciona una orden"
        description="Elige una orden para revisar su detalle, editar borrador o registrar una recepcion."
      />
    );
  }

  const summary = summarizeOrderDetail(order);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{order.folio}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.supplier?.name ?? "Sin proveedor"}
            </p>
          </div>
          <Badge
            variant={
              order.status === "cancelled"
                ? "destructive"
                : order.status === "received"
                  ? "success"
                  : order.status === "partially_received"
                    ? "warning"
                    : "default"
            }
          >
            {getPurchaseOrderStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Subtotal" value={formatCurrency(order.subtotal)} />
          <Metric label="Impuestos" value={formatCurrency(order.taxTotal)} />
          <Metric label="Total" value={formatCurrency(order.total)} />
          <Metric
            label="Pendiente"
            value={`${formatQuantity(summary.pendingQuantity)} uds`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onEdit} disabled={!order.canEdit}>
            Editar borrador
          </Button>
          <Button type="button" variant="outline" onClick={onSubmit} disabled={!order.canSubmit}>
            Enviar orden
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onCancel}
            disabled={!order.canCancel}
          >
            Cancelar orden
          </Button>
          <Button
            type="button"
            onClick={onReceive}
            disabled={summary.pendingQuantity <= 0}
          >
            Registrar recepcion
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Lineas
          </h3>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 md:grid-cols-[1.2fr_0.55fr_0.55fr_0.55fr]"
            >
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {item.sku ?? "sin SKU"}
                </p>
              </div>
              <Metric label="Pedido" value={String(item.quantity)} />
              <Metric label="Recibido" value={String(item.receivedQuantity)} />
              <Metric label="Pendiente" value={String(item.pendingQuantity)} />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Recepciones
          </h3>
          {order.receipts.length === 0 ? (
            <EmptyState
              title="Sin recepciones"
              description="Todavia no se han registrado recepciones para esta orden."
            />
          ) : (
            order.receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="rounded-2xl border border-border bg-white/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{receipt.folio}</p>
                    <p className="text-sm text-muted-foreground">
                      {receipt.locationName} |{" "}
                      {new Date(receipt.createdAt).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {receipt.items.length} movimientos
                  </p>
                </div>
                {receipt.notes ? (
                  <p className="mt-2 text-sm">{receipt.notes}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
