"use client";

import { useMemo, useState } from "react";
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
import type { CreateInventoryProductPayload } from "@/features/inventory/types";

export function CreateProductForm({
  business_id,
  branch_id,
  loading,
  onSubmit,
}: {
  business_id: string;
  branch_id: string;
  loading: boolean;
  onSubmit: (payload: CreateInventoryProductPayload) => Promise<void>;
}) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [minStock, setMinStock] = useState("0");
  const [initialStock, setInitialStock] = useState("0");
  const [trackInventory, setTrackInventory] = useState(true);

  const isInvalid = useMemo(() => {
    const cost = Number(costPrice);
    const sale = Number(salePrice);
    const min = Number(minStock);
    const initial = Number(initialStock);

    return (
      sku.trim().length === 0 ||
      name.trim().length === 0 ||
      Number.isNaN(cost) ||
      Number.isNaN(sale) ||
      Number.isNaN(min) ||
      Number.isNaN(initial) ||
      cost < 0 ||
      sale < 0 ||
      min < 0 ||
      initial < 0 ||
      (!trackInventory && initial > 0)
    );
  }, [costPrice, initialStock, minStock, name, salePrice, sku, trackInventory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alta de producto</CardTitle>
        <CardDescription>
          Crea un articulo real del inventario y, si aplica, asignale stock
          inicial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Coca Cola 600ml"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU</Label>
            <Input
              id="product-sku"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="SKU-0002"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-barcode">Codigo de barras</Label>
            <Input
              id="product-barcode"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="750100000002"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-sale-price">Precio de venta</Label>
            <Input
              id="product-sale-price"
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-cost-price">Costo</Label>
            <Input
              id="product-cost-price"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(event) => setCostPrice(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-min-stock">Stock minimo</Label>
            <Input
              id="product-min-stock"
              type="number"
              min="0"
              step="0.001"
              value={minStock}
              onChange={(event) => setMinStock(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-initial-stock">Stock inicial</Label>
            <Input
              id="product-initial-stock"
              type="number"
              min="0"
              step="0.001"
              value={initialStock}
              onChange={(event) => setInitialStock(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-white/60 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={trackInventory}
              onChange={(event) => setTrackInventory(event.target.checked)}
            />
            Controlar inventario
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description">Descripcion</Label>
          <Textarea
            id="product-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detalles opcionales del articulo"
          />
        </div>

        <Button
          className="w-full"
          disabled={loading || isInvalid}
          onClick={() =>
            onSubmit({
              business_id,
              branch_id,
              sku: sku.trim(),
              name: name.trim(),
              barcode: barcode.trim() || undefined,
              description: description.trim() || undefined,
              cost_price: Number(costPrice),
              sale_price: Number(salePrice),
              min_stock: Number(minStock),
              initial_stock: Number(initialStock),
              track_inventory: trackInventory,
            })
          }
        >
          {loading ? "Guardando..." : "Crear producto"}
        </Button>
      </CardContent>
    </Card>
  );
}
