"use client";

import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
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
import {
  formatInventoryQuantity,
  getInventoryMovementLabel,
} from "@/features/inventory/presentation";
import { useInventoryMovementsQuery } from "@/features/inventory/hooks";
import { useProductSearch } from "@/features/products/hooks";
import type { InventoryLocationOption } from "@/features/inventory/types";
import type { ProductSearchResult } from "@/features/products/types";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { formatCurrency } from "@/lib/utils";

const MOVEMENT_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "purchase_in", label: "Compra" },
  { value: "sale_out", label: "Venta" },
  { value: "refund_in", label: "Devolucion" },
  { value: "adjustment_in", label: "Ajuste +" },
  { value: "adjustment_out", label: "Ajuste -" },
  { value: "transfer_in", label: "Transferencia +" },
  { value: "transfer_out", label: "Transferencia -" },
  { value: "return_to_supplier", label: "Retorno a proveedor" },
];

export function InventoryMovementsPanel({
  businessId,
  branchId,
  locations,
}: {
  businessId: string;
  branchId: string;
  locations: InventoryLocationOption[];
}) {
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(
    null,
  );
  const [locationId, setLocationId] = useState("");
  const [movementType, setMovementType] = useState("");

  const productSearchQuery = useProductSearch(
    businessId,
    branchId,
    productSearch,
    2,
  );
  const movementsQuery = useInventoryMovementsQuery(businessId, branchId, {
    productId: selectedProduct?.id ?? null,
    locationId: locationId || null,
    movementType: movementType || null,
    limit: 50,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos</CardTitle>
        <CardDescription>
          Historial operativo de compras, ventas, devoluciones, ajustes y
          transferencias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_0.7fr_0.7fr]">
          <div className="space-y-2">
            <Input
              value={selectedProduct ? selectedProduct.name : productSearch}
              onChange={(event) => {
                setSelectedProduct(null);
                setProductSearch(event.target.value);
              }}
              placeholder="Filtrar por producto"
            />
            {!selectedProduct && productSearchQuery.data?.length ? (
              <div className="space-y-2 rounded-2xl border border-border bg-white/60 p-3">
                {productSearchQuery.data.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white"
                    onClick={() => {
                      setSelectedProduct(product);
                      setProductSearch(product.name);
                    }}
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku ?? "sin SKU"}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.availableStock} uds
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <select
            className="h-10 rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.isDefault ? " (Default)" : ""}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={movementType}
            onChange={(event) => setMovementType(event.target.value)}
          >
            {MOVEMENT_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedProduct(null);
                setProductSearch("");
              }}
            >
              Quitar filtro de producto
            </Button>
          </div>
        ) : null}

        {movementsQuery.error && movementsQuery.data ? (
          <NoticeBanner
            message="No se pudo actualizar el historial en este momento."
            actionLabel="Intenta nuevamente"
            onAction={() => void movementsQuery.refetch()}
          />
        ) : null}

        {movementsQuery.error && !movementsQuery.data ? (
          <ErrorState
            message={getFriendlyErrorMessage(
              movementsQuery.error,
              "No se pudo cargar el historial de movimientos.",
            )}
            actionLabel="Reintentar"
            onAction={() => void movementsQuery.refetch()}
          />
        ) : null}

        {movementsQuery.isLoading && !movementsQuery.data ? (
          <LoadingState message="Cargando movimientos..." />
        ) : null}

        {!movementsQuery.isLoading &&
        !movementsQuery.error &&
        movementsQuery.data?.length === 0 ? (
          <EmptyState
            title="Sin movimientos"
            description="No hay movimientos que coincidan con los filtros actuales."
          />
        ) : null}

        <div className="space-y-3">
          {movementsQuery.data?.map((movement) => (
            <div
              key={movement.id}
              className="rounded-2xl border border-border bg-white/60 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {movement.productName ?? "Producto"}
                    </p>
                    <Badge>{getInventoryMovementLabel(movement.movementType)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {movement.locationName} |{" "}
                    {new Date(movement.createdAt).toLocaleString("es-MX")}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <p className="font-semibold">
                    {formatInventoryQuantity(movement.quantity)} uds
                  </p>
                  <p className="text-muted-foreground">
                    {formatCurrency(movement.unitCost)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>SKU: {movement.productSku ?? "sin SKU"}</span>
                <span>Referencia: {movement.referenceLabel ?? "Sin referencia"}</span>
                <span>Usuario: {movement.createdByName ?? "Sin usuario"}</span>
              </div>

              {movement.notes ? <p className="mt-2 text-sm">{movement.notes}</p> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
