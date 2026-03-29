"use client";

import { useMemo, useState, type ReactNode } from "react";
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
import { useProductSearch } from "@/features/products/hooks";
import type { ProductSearchResult } from "@/features/products/types";
import type {
  CreateInventoryEntryPayload,
  InventoryCatalogs,
} from "@/features/inventory/types";
import { formatCurrency } from "@/lib/utils";

interface EntryLineItem {
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: string;
  unit_cost: string;
}

export function InventoryEntryForm({
  business_id,
  branch_id,
  catalogs,
  loading,
  onSubmit,
}: {
  business_id: string;
  branch_id: string;
  catalogs?: InventoryCatalogs | null;
  loading: boolean;
  onSubmit: (payload: CreateInventoryEntryPayload) => Promise<void>;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<EntryLineItem[]>([]);
  const searchQuery = useProductSearch(business_id, branch_id, searchTerm, 2);

  const isInvalid = useMemo(() => {
    return (
      !locationId ||
      items.length === 0 ||
      items.some((item) => {
        const quantity = Number(item.quantity);
        const unitCost = Number(item.unit_cost);

        return (
          Number.isNaN(quantity) ||
          quantity <= 0 ||
          (item.unit_cost.trim().length > 0 &&
            (Number.isNaN(unitCost) || unitCost < 0))
        );
      })
    );
  }, [items, locationId]);

  const addProduct = (product: ProductSearchResult) => {
    setItems((current) => {
      if (current.some((item) => item.product_id === product.id)) {
        return current;
      }

      return [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          quantity: "1",
          unit_cost: "",
        },
      ];
    });
    setSearchTerm("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entradas</CardTitle>
        <CardDescription>
          Registra mercancia recibida sin salir del modulo de inventario.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ubicacion" htmlFor="entry-location">
            <select
              id="entry-location"
              className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              <option value="">Selecciona una ubicacion</option>
              {catalogs?.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                  {location.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Proveedor" htmlFor="entry-supplier">
            <select
              id="entry-supplier"
              className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">Sin proveedor</option>
              {catalogs?.suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Buscar producto" htmlFor="entry-product-search">
          <Input
            id="entry-product-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Escribe nombre, SKU o barcode"
          />
        </Field>

        {searchTerm.trim().length >= 2 && searchQuery.data?.length ? (
          <div className="space-y-2 rounded-2xl border border-border bg-white/60 p-3">
            {searchQuery.data.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left hover:border-border hover:bg-white"
                onClick={() => addProduct(product)}
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku ?? "sin SKU"} | Stock actual:{" "}
                    {product.availableStock}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(product.unitPrice)}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-muted-foreground">
              Agrega al menos un articulo para registrar la entrada.
            </div>
          ) : null}

          {items.map((item) => (
            <div
              key={item.product_id}
              className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 lg:grid-cols-[1.2fr_140px_140px_auto]"
            >
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {item.sku ?? "sin SKU"}
                </p>
              </div>

              <Field label="Cantidad" htmlFor={`qty-${item.product_id}`}>
                <Input
                  id={`qty-${item.product_id}`}
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={item.quantity}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((currentItem) =>
                        currentItem.product_id === item.product_id
                          ? { ...currentItem, quantity: event.target.value }
                          : currentItem,
                      ),
                    )
                  }
                />
              </Field>

              <Field label="Costo unitario" htmlFor={`cost-${item.product_id}`}>
                <Input
                  id={`cost-${item.product_id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_cost}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((currentItem) =>
                        currentItem.product_id === item.product_id
                          ? { ...currentItem, unit_cost: event.target.value }
                          : currentItem,
                      ),
                    )
                  }
                  placeholder="Opcional"
                />
              </Field>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItems((current) =>
                      current.filter(
                        (currentItem) =>
                          currentItem.product_id !== item.product_id,
                      ),
                    )
                  }
                >
                  Quitar
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Field label="Notas" htmlFor="entry-notes">
          <Textarea
            id="entry-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Observaciones opcionales de la recepcion"
          />
        </Field>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={loading || isInvalid}
            onClick={async () => {
              await onSubmit({
                business_id,
                branch_id,
                location_id: locationId,
                supplier_id: supplierId || undefined,
                notes: notes.trim() || undefined,
                items: items.map((item) => ({
                  product_id: item.product_id,
                  quantity: Number(item.quantity),
                  unit_cost:
                    item.unit_cost.trim().length > 0
                      ? Number(item.unit_cost)
                      : undefined,
                })),
              });

              setItems([]);
              setNotes("");
              setSearchTerm("");
            }}
          >
            {loading ? "Guardando..." : "Registrar entrada"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
