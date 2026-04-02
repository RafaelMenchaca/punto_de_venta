"use client";

import { PosEmptySaleState } from "@/components/pos/pos-empty-sale-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SaleCartItem } from "@/features/sales/types";
import { formatCurrency } from "@/lib/utils";

export function PosCart({
  items,
  saleTotal,
  onQuantityChange,
  onLineDiscountChange,
  onRemove,
}: {
  items: SaleCartItem[];
  saleTotal: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onLineDiscountChange: (productId: string, discount: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/92">
      <CardHeader className="pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              Venta actual
            </p>
            <CardTitle className="text-xl md:text-[1.8rem]">
              Lineas capturadas
            </CardTitle>
            <CardDescription className="max-w-2xl">
              La venta se revisa desde aqui. Ajusta cantidades, descuentos y
              netos sin perder de vista el total en vivo.
            </CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SaleMetaTile
              label="Lineas"
              value={String(items.length)}
              helper={
                items.length > 0
                  ? "Listas para ajuste rapido"
                  : "Aun sin productos"
              }
            />
            <SaleMetaTile
              label="Total en vivo"
              value={formatCurrency(saleTotal)}
              helper="Actualizado con cada cambio"
              emphasized
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <PosEmptySaleState />
        ) : null}

        {items.map((item) => {
          const baseSubtotal = item.unit_price * item.quantity;
          const normalizedDiscount = Math.min(
            Math.max(item.line_discount || 0, 0),
            baseSubtotal,
          );

          return (
            <div
              key={item.product_id}
              className="rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,228,214,0.42))] p-4 shadow-[0_12px_24px_rgba(23,23,23,0.05)] md:p-5"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_170px_170px_210px]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-base font-semibold">
                        {item.product_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku ?? "sin SKU"}
                      </p>
                    </div>

                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.track_inventory
                        ? `Stock ${item.available_stock}`
                        : "Sin control"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border/80 bg-white/75 px-3 py-1">
                      Precio {formatCurrency(item.unit_price)}
                    </span>
                    <span className="rounded-full border border-border/80 bg-white/75 px-3 py-1">
                      Base {formatCurrency(baseSubtotal)}
                    </span>
                    {normalizedDiscount > 0 ? (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                        Desc. {formatCurrency(normalizedDiscount)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Cantidad
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-11 w-11 rounded-xl px-0"
                      onClick={() =>
                        onQuantityChange(item.product_id, item.quantity - 1)
                      }
                    >
                      -
                    </Button>
                    <Input
                      className="h-11 text-center text-base"
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        onQuantityChange(
                          item.product_id,
                          Number(event.target.value),
                        )
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-11 w-11 rounded-xl px-0"
                      onClick={() =>
                        onQuantityChange(item.product_id, item.quantity + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Descuento
                  </p>
                  <Input
                    className="h-11"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.line_discount}
                    onChange={(event) =>
                      onLineDiscountChange(
                        item.product_id,
                        Number(event.target.value),
                      )
                    }
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Importe directo sobre la linea.
                  </p>
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-[1.35rem] border border-white/80 bg-white/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Neto
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {formatCurrency(baseSubtotal - normalizedDiscount)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRemove(item.product_id)}
                  >
                    Quitar linea
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SaleMetaTile({
  label,
  value,
  helper,
  emphasized = false,
}: {
  label: string;
  value: string;
  helper: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-muted/34 p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 font-semibold tracking-tight ${
          emphasized ? "text-2xl" : "text-lg"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  );
}
