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
  onRemove,
}: {
  items: SaleCartItem[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrito</CardTitle>
        <CardDescription>
          Ajusta cantidades antes de cerrar la venta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="Carrito vacio"
            description="Busca productos y agregalos al carrito para vender."
          />
        ) : null}

        {items.map((item) => (
          <div
            key={item.product_id}
            className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 md:grid-cols-[1.2fr_120px_120px]"
          >
            <div>
              <p className="font-medium">{item.product_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                SKU: {item.sku ?? "sin SKU"} | Stock: {item.available_stock}
              </p>
            </div>

            <Input
              type="number"
              min="1"
              step="1"
              value={item.quantity}
              onChange={(event) =>
                onQuantityChange(item.product_id, Number(event.target.value))
              }
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">
                {formatCurrency(item.unit_price * item.quantity)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(item.product_id)}
              >
                Quitar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
