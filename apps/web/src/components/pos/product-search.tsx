"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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
  autoFocus = false,
}: {
  business_id: string;
  branch_id: string;
  onSelect: (product: ProductSearchResult) => void;
  actionLabel?: string;
  disableOutOfStock?: boolean;
  minimumQueryLength?: number;
  autoFocus?: boolean;
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

  return (
    <Card className="overflow-hidden border-white/80 bg-white/90">
      <CardHeader className="pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              Inicio de la venta
            </p>
            <CardTitle className="text-xl md:text-[1.8rem]">
              Agregar productos
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Busca por nombre, SKU o codigo de barras. Esta es la entrada
              principal para capturar la venta actual.
            </CardDescription>
          </div>

          <div className="rounded-[1.45rem] border border-primary/10 bg-primary/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Atajo operativo
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              Escribe al menos {minimumQueryLength} caracter
              {minimumQueryLength === 1 ? "" : "es"} para ver resultados.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[1.7rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(255,255,255,0.92)_42%,rgba(236,228,214,0.64))] p-2 shadow-[0_14px_30px_rgba(15,118,110,0.08)]">
          <div className="flex items-center gap-3 rounded-[1.35rem] bg-white/92 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <Search className="h-5 w-5 text-primary" />
            <Input
              className="h-14 border-none bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
              placeholder="Buscar por nombre, SKU o codigo de barras"
              value={term}
              autoFocus={autoFocus}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>
        </div>

        {!normalizedTerm ? (
          <div className="grid gap-3 md:grid-cols-3">
            <GuideTile
              label="Nombre"
              description="Encuentra articulos por descripcion comercial."
            />
            <GuideTile
              label="SKU"
              description="Ubica productos rapidos usando su clave interna."
            />
            <GuideTile
              label="Codigo"
              description="Tambien puedes buscar por codigo de barras."
            />
          </div>
        ) : null}

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
        {hasSearchTerm && query.data?.length === 0 ? (
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Resultados
            </p>
            <p className="text-sm text-muted-foreground">
              {query.data.length} producto{query.data.length === 1 ? "" : "s"}
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-2">
          {query.data?.map((product) => {
            const outOfStock =
              disableOutOfStock &&
              product.trackInventory &&
              product.availableStock <= 0;

            return (
              <div
                key={product.id}
                className="rounded-[1.5rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,228,214,0.42))] p-4 shadow-[0_12px_24px_rgba(23,23,23,0.05)]"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{product.name}</p>
                        {product.trackInventory ? (
                          <Badge
                            variant={
                              outOfStock ? "destructive" : "success"
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
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatCurrency(product.unitPrice)}
                    </p>
                    <Button
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

function GuideTile({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/76 p-4 shadow-[0_10px_20px_rgba(23,23,23,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{description}</p>
    </div>
  );
}
