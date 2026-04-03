"use client";

import { PosEmptySaleState } from "@/components/pos/pos-empty-sale-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SaleCartItem } from "@/features/sales/types";
import { cn, formatCurrency } from "@/lib/utils";

export function PosCart({
  items,
  saleTotal,
  onQuantityChange,
  onLineDiscountChange,
  onRemove,
  className,
}: {
  items: SaleCartItem[];
  saleTotal: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onLineDiscountChange: (productId: string, discount: number) => void;
  onRemove: (productId: string) => void;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[1.3rem] border border-black/10 bg-white/88",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-black/8 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Venta actual
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} linea{items.length === 1 ? "" : "s"} activa
            {items.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {formatCurrency(saleTotal)}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <PosEmptySaleState />
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1.4fr)_90px_120px_130px_100px] gap-3 border-b border-black/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground xl:grid">
            <span>Articulo</span>
            <span>Cantidad</span>
            <span>Unitario</span>
            <span>Subtotal</span>
            <span className="text-right">Accion</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.map((item) => {
              const baseSubtotal = item.unit_price * item.quantity;
              const normalizedDiscount = Math.min(
                Math.max(item.line_discount || 0, 0),
                baseSubtotal,
              );
              const netSubtotal = baseSubtotal - normalizedDiscount;

              return (
                <div
                  key={item.product_id}
                  className="border-b border-black/6 px-4 py-3 last:border-b-0"
                >
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_90px_120px_130px_100px] xl:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.product_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        SKU: {item.sku ?? "sin SKU"}
                        {item.track_inventory
                          ? ` | Stock ${item.available_stock}`
                          : " | Sin control"}
                        {normalizedDiscount > 0
                          ? ` | Desc. ${formatCurrency(normalizedDiscount)}`
                          : ""}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground xl:hidden">
                        Cantidad
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 px-0"
                          onClick={() =>
                            onQuantityChange(item.product_id, item.quantity - 1)
                          }
                        >
                          -
                        </Button>
                        <Input
                          className="h-9 text-center"
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
                          className="h-9 w-9 px-0"
                          onClick={() =>
                            onQuantityChange(item.product_id, item.quantity + 1)
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground xl:hidden">
                        Unitario
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(item.unit_price)}
                      </p>
                      <Input
                        className="h-9"
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

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground xl:hidden">
                        Subtotal
                      </p>
                      <p className="text-lg font-semibold tracking-tight">
                        {formatCurrency(netSubtotal)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Base {formatCurrency(baseSubtotal)}
                      </p>
                    </div>

                    <div className="flex justify-start xl:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onRemove(item.product_id)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
