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
          Ajusta cantidades y descuentos por linea antes de cobrar.
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
              className="grid gap-4 rounded-2xl border border-border bg-white/70 p-4 xl:grid-cols-[1.3fr_120px_150px_170px]"
            >
              <div className="space-y-2">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    SKU: {item.sku ?? "sin SKU"} | Stock: {item.available_stock}
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

              <div className="flex flex-col justify-between gap-3 rounded-2xl bg-muted/50 p-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Importe
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {formatCurrency(baseSubtotal - normalizedDiscount)}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemove(item.product_id)}
                >
                  Quitar
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
