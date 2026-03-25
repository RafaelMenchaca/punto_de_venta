"use client";

import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProductSearch } from "@/features/products/hooks";
import type { ProductSearchResult } from "@/features/products/types";
import { formatCurrency } from "@/lib/utils";

export function ProductSearch({
  business_id,
  branch_id,
  onSelect,
  actionLabel = "Agregar",
  disableOutOfStock = false,
  minimumQueryLength = 2,
}: {
  business_id: string;
  branch_id: string;
  onSelect: (product: ProductSearchResult) => void;
  actionLabel?: string;
  disableOutOfStock?: boolean;
  minimumQueryLength?: number;
}) {
  const [term, setTerm] = useState("");
  const query = useProductSearch(
    business_id,
    branch_id,
    term,
    minimumQueryLength,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar producto</CardTitle>
        <CardDescription>
          Busca por nombre, SKU o codigo de barras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Ej. refresco, 750100..."
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />

        {query.isLoading ? (
          <LoadingState message="Buscando productos..." />
        ) : null}
        {query.error instanceof Error ? (
          <ErrorState
            message={query.error.message}
            actionLabel="Reintentar"
            onAction={() => void query.refetch()}
          />
        ) : null}
        {term.trim().length >= minimumQueryLength && query.data?.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description={
              minimumQueryLength === 0
                ? "Todavia no hay productos activos para mostrar."
                : "Prueba con otro nombre, SKU o codigo de barras."
            }
          />
        ) : null}

        <div className="space-y-3">
          {query.data?.map((product) => {
            const outOfStock =
              disableOutOfStock &&
              product.trackInventory &&
              product.availableStock <= 0;

            return (
              <div
                key={product.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-white/60 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    SKU: {product.sku ?? "sin SKU"} | Stock:{" "}
                    {product.availableStock}
                  </p>
                  {product.categoryName || product.brandName ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[product.categoryName, product.brandName]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">
                    {formatCurrency(product.unitPrice)}
                  </p>
                  <Button
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
      </CardContent>
    </Card>
  );
}
