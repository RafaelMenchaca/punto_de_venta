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
import type { SaleCartItem } from "@/features/sales/types";
import { formatCurrency } from "@/lib/utils";

export function PosCart({
  items,
  onQuantityChange,
  onLineDiscountChange,
  onRemove,
}: {
  items: SaleCartItem[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onLineDiscountChange: (productId: string, discount: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrito</CardTitle>
        <CardDescription>
          Ajusta cantidades y descuentos por linea antes de pasar al cobro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="Carrito vacio"
            description="Busca productos y agregalos al carrito para vender."
          />
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
              className="grid gap-4 rounded-[1.45rem] border border-border bg-white/74 p-5 shadow-[0_10px_24px_rgba(23,23,23,0.04)] xl:grid-cols-[1.25fr_120px_150px_190px]"
            >
              <div className="space-y-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.product_name}</p>
                    {item.track_inventory ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Stock {item.available_stock}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    SKU: {item.sku ?? "sin SKU"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Precio: {formatCurrency(item.unit_price)}</span>
                  <span>Base: {formatCurrency(baseSubtotal)}</span>
                  {normalizedDiscount > 0 ? (
                    <span>Desc.: {formatCurrency(normalizedDiscount)}</span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cantidad
                </p>
                <Input
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
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Descuento
                </p>
                <Input
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
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-[1.2rem] bg-muted/70 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Neto
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">
                    {formatCurrency(baseSubtotal - normalizedDiscount)}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemove(item.product_id)}
                >
                  Quitar linea
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
