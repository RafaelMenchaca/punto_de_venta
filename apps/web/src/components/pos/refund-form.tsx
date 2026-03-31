"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SaleDetailResponse } from "@/features/sales/types";
import { formatCurrency } from "@/lib/utils";

export function RefundForm({
  sale,
  values,
  reason,
  loading,
  onValueChange,
  onReasonChange,
  onSubmit,
}: {
  sale: SaleDetailResponse | null;
  values: Record<string, string>;
  reason: string;
  loading: boolean;
  onValueChange: (saleItemId: string, value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  if (!sale) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            title="Selecciona una venta"
            description="Elige una venta para registrar la devolucion."
          />
        </CardContent>
      </Card>
    );
  }

  const refundableItems = sale.items.filter(
    (item) => item.remainingQuantity > 0.0009,
  );
  const selectedItems = refundableItems
    .map((item) => {
      const quantity = Number(values[item.id] ?? 0);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        item,
        quantity,
        total: (item.total * quantity) / item.quantity,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
  const refundTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar devolucion</CardTitle>
        <CardDescription>
          Selecciona cantidades validas de la venta {sale.sale.folio}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <RefundMetric
            label="Items disponibles"
            value={String(refundableItems.length)}
          />
          <RefundMetric
            label="Seleccionados"
            value={String(selectedItems.length)}
          />
          <RefundMetric
            label="Reembolso estimado"
            value={formatCurrency(refundTotal)}
            emphasized
          />
        </div>

        {refundableItems.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-[1.4rem] border border-border bg-white/72 p-4 md:grid-cols-[1.5fr_140px_140px_1fr]"
          >
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.sku ?? "sin SKU"} | Vendido: {item.quantity} | Disponible
                a devolver: {item.remainingQuantity}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Cantidad
              </p>
              <Input
                type="number"
                min="0"
                max={item.remainingQuantity}
                step="0.001"
                value={values[item.id] ?? ""}
                onChange={(event) => onValueChange(item.id, event.target.value)}
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Total linea
              </p>
              <p className="mt-2 font-medium">{formatCurrency(item.total)}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Reembolso estimado
              </p>
              <p className="mt-2 font-semibold">
                {formatCurrency(
                  Number(values[item.id] ?? 0) > 0
                    ? (item.total * Number(values[item.id] ?? 0)) /
                        item.quantity
                    : 0,
                )}
              </p>
            </div>
          </div>
        ))}

        <Textarea
          placeholder="Motivo opcional de la devolucion"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/70 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Total a devolver
            </p>
            <p className="mt-2 text-lg font-semibold">
              {formatCurrency(refundTotal)}
            </p>
          </div>

          <Button
            type="button"
            disabled={loading || selectedItems.length === 0}
            onClick={() => void onSubmit()}
          >
            {loading ? "Registrando..." : "Confirmar devolucion"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RefundMetric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-white/72 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-3 ${emphasized ? "text-2xl font-semibold" : "text-lg font-semibold"}`}>
        {value}
      </p>
    </div>
  );
}
