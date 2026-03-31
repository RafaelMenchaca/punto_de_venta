"use client";

import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
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
import { getFriendlyErrorMessage } from "@/lib/api/errors";
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
          Busca por nombre, SKU o codigo de barras y agrega rapidamente al carrito.
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
            message={getFriendlyErrorMessage(
              query.error,
              "Hubo un problema al cargar los productos.",
            )}
            actionLabel="Reintentar"
            onAction={() => void query.refetch()}
          />
        ) : null}
        {term.trim().length >= minimumQueryLength &&
        query.data?.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description={
              minimumQueryLength === 0
                ? "Todavia no hay productos activos para mostrar."
                : "Prueba con otro nombre, SKU o codigo de barras."
            }
          />
        ) : null}

        {query.data?.length ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Resultados
            </p>
            <p className="text-sm text-muted-foreground">
              {query.data.length} producto{query.data.length === 1 ? "" : "s"}
            </p>
          </div>
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
                className="rounded-[1.35rem] border border-border/80 bg-white/72 p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)]"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{product.name}</p>
                        {product.trackInventory ? (
                          <Badge
                            variant={
                              outOfStock
                                ? "destructive"
                                : "success"
                            }
                          >
                            {outOfStock ? "Sin stock" : "Disponible"}
                          </Badge>
                        ) : (
                          <Badge>Sin control</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku ?? "sin SKU"} | Stock:{" "}
                        {product.availableStock}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>
                        Categoria: {product.categoryName ?? "Sin categoria"}
                      </span>
                      <span>Marca: {product.brandName ?? "Sin marca"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <p className="text-lg font-semibold tracking-tight">
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
