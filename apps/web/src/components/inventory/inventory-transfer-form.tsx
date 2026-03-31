"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { useProductSearch } from "@/features/products/hooks";
import type { ProductSearchResult } from "@/features/products/types";
import {
  formatInventoryQuantity,
} from "@/features/inventory/presentation";
import {
  useCreateInventoryTransferMutation,
  useProductStock,
} from "@/features/inventory/hooks";
import type { InventoryLocationOption } from "@/features/inventory/types";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export function InventoryTransferForm({
  businessId,
  branchId,
  locations,
}: {
  businessId: string;
  branchId: string;
  locations: InventoryLocationOption[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(
    null,
  );
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const productSearchQuery = useProductSearch(
    businessId,
    branchId,
    searchTerm,
    2,
  );
  const stockQuery = useProductStock(
    selectedProduct?.id ?? null,
    businessId,
    branchId,
  );
  const transferMutation = useCreateInventoryTransferMutation(
    businessId,
    branchId,
    selectedProduct?.id ?? null,
  );

  const fromLocationStock = useMemo(() => {
    if (!fromLocationId) {
      return null;
    }

    return (
      stockQuery.data?.locations.find(
        (location) => location.locationId === fromLocationId,
      ) ?? null
    );
  }, [fromLocationId, stockQuery.data?.locations]);

  const numericQuantity = Number(quantity);
  const isInvalid =
    !selectedProduct ||
    !fromLocationId ||
    !toLocationId ||
    fromLocationId === toLocationId ||
    Number.isNaN(numericQuantity) ||
    numericQuantity <= 0 ||
    numericQuantity > (fromLocationStock?.availableQuantity ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transferencias</CardTitle>
        <CardDescription>
          Mueve stock entre ubicaciones de la misma sucursal sin perder
          trazabilidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="transfer-product-search">Producto</Label>
          <Input
            id="transfer-product-search"
            value={selectedProduct ? selectedProduct.name : searchTerm}
            onChange={(event) => {
              setSelectedProduct(null);
              setSearchTerm(event.target.value);
            }}
            placeholder="Busca por nombre, SKU o barcode"
          />
        </div>

        {!selectedProduct && productSearchQuery.data?.length ? (
          <div className="space-y-2 rounded-2xl border border-border bg-white/60 p-3">
            {productSearchQuery.data.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white"
                onClick={() => {
                  setSelectedProduct(product);
                  setSearchTerm(product.name);
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

        {selectedProduct ? (
          <div className="rounded-2xl border border-border bg-white/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {selectedProduct.sku ?? "sin SKU"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedProduct(null);
                  setSearchTerm("");
                  setFromLocationId("");
                  setToLocationId("");
                  setQuantity("");
                }}
              >
                Cambiar producto
              </Button>
            </div>
          </div>
        ) : null}

        {selectedProduct && stockQuery.error ? (
          <NoticeBanner
            message="No se pudo actualizar el stock disponible en este momento."
            actionLabel="Intenta nuevamente"
            onAction={() => void stockQuery.refetch()}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transfer-from-location">Origen</Label>
            <select
              id="transfer-from-location"
              className="ui-select"
              value={fromLocationId}
              onChange={(event) => setFromLocationId(event.target.value)}
            >
              <option value="">Selecciona una ubicacion</option>
              {locations
                .filter((location) => location.isActive)
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.isDefault ? " (Default)" : ""}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-to-location">Destino</Label>
            <select
              id="transfer-to-location"
              className="ui-select"
              value={toLocationId}
              onChange={(event) => setToLocationId(event.target.value)}
            >
              <option value="">Selecciona una ubicacion</option>
              {locations
                .filter((location) => location.isActive)
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.isDefault ? " (Default)" : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {fromLocationStock ? (
          <div className="rounded-2xl bg-muted/70 p-4 text-sm">
            Disponible en origen:{" "}
            <span className="font-semibold">
              {formatInventoryQuantity(fromLocationStock.availableQuantity)} uds
            </span>
          </div>
        ) : selectedProduct && stockQuery.isLoading ? (
          <div className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">
            Consultando stock por ubicacion...
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[0.45fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="transfer-quantity">Cantidad</Label>
            <Input
              id="transfer-quantity"
              type="number"
              min="0.001"
              step="0.001"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Notas</Label>
            <Textarea
              id="transfer-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Motivo o comentario de la transferencia"
            />
          </div>
        </div>

        {fromLocationId && toLocationId && fromLocationId === toLocationId ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            La ubicacion origen y destino deben ser distintas.
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={transferMutation.isPending || isInvalid}
            onClick={async () => {
              if (!selectedProduct) {
                return;
              }

              try {
                await transferMutation.mutateAsync({
                  business_id: businessId,
                  branch_id: branchId,
                  product_id: selectedProduct.id,
                  from_location_id: fromLocationId,
                  to_location_id: toLocationId,
                  quantity: numericQuantity,
                  notes: notes.trim() || undefined,
                });

                toast.success("Transferencia registrada.");
                setSelectedProduct(null);
                setSearchTerm("");
                setFromLocationId("");
                setToLocationId("");
                setQuantity("");
                setNotes("");
              } catch (error) {
                toast.error(
                  getFriendlyErrorMessage(
                    error,
                    "No se pudo registrar la transferencia.",
                  ),
                );
              }
            }}
          >
            {transferMutation.isPending ? "Guardando..." : "Registrar transferencia"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
