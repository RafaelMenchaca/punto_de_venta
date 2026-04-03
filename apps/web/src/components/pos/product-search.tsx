"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductSearch } from "@/features/products/hooks";
import type { ProductSearchResult } from "@/features/products/types";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { cn, formatCurrency } from "@/lib/utils";

export function ProductSearch({
  business_id,
  branch_id,
  onSelect,
  actionLabel = "Agregar",
  disableOutOfStock = false,
  minimumQueryLength = 2,
  autoFocus = false,
  className,
}: {
  business_id: string;
  branch_id: string;
  onSelect: (product: ProductSearchResult) => void;
  actionLabel?: string;
  disableOutOfStock?: boolean;
  minimumQueryLength?: number;
  autoFocus?: boolean;
  className?: string;
}) {
  const [term, setTerm] = useState("");
  const query = useProductSearch(
    business_id,
    branch_id,
    term,
    minimumQueryLength,
  );
  const normalizedTerm = term.trim();
  const hasSearchTerm = normalizedTerm.length >= minimumQueryLength;
  const helperMessage = !normalizedTerm
    ? "Captura por nombre, SKU o codigo de barras. El foco principal empieza aqui."
    : hasSearchTerm && query.data?.length
      ? `${query.data.length} resultado${query.data.length === 1 ? "" : "s"} disponible${query.data.length === 1 ? "" : "s"}.`
      : `Escribe al menos ${minimumQueryLength} caracter${minimumQueryLength === 1 ? "" : "es"} para buscar.`;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.3rem] border border-black/10 bg-white/88",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-black/8 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Search className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Captura de articulos
          </p>
          <Input
            className="mt-2 h-12 border-black/10 bg-transparent px-0 text-lg shadow-none focus-visible:ring-0"
            placeholder="Buscar por nombre, SKU o codigo de barras"
            value={term}
            autoFocus={autoFocus}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="border-b border-black/6 px-4 py-2 text-sm text-muted-foreground">
        {helperMessage}
      </div>

      {query.isLoading ? (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          Buscando productos...
        </div>
      ) : null}

      {query.error instanceof Error ? (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getFriendlyErrorMessage(
            query.error,
            "Hubo un problema al cargar los productos.",
          )}
        </div>
      ) : null}

      {hasSearchTerm && !query.isLoading && query.data?.length === 0 ? (
        <div className="px-4 py-4 text-sm text-muted-foreground">
          No hay coincidencias para esta busqueda.
        </div>
      ) : null}

      {query.data?.length ? (
        <div className="max-h-60 overflow-y-auto">
          {query.data.map((product) => {
            const outOfStock =
              disableOutOfStock &&
              product.trackInventory &&
              product.availableStock <= 0;

            return (
              <div
                key={product.id}
                className="grid gap-3 border-t border-black/6 px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px_120px_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    SKU: {product.sku ?? "sin SKU"} | Stock:{" "}
                    {product.availableStock}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  {product.categoryName ?? "Sin categoria"}
                </div>

                <div className="text-base font-semibold">
                  {formatCurrency(product.unitPrice)}
                </div>

                <div className="flex justify-start md:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={outOfStock}
                    onClick={() => onSelect(product)}
                  >
                    {outOfStock ? "Sin stock" : actionLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
