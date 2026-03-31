"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatInventoryQuantity } from "@/features/inventory/presentation";
import type {
  ProductStockLocation,
  StockAdjustmentPayload,
} from "@/features/inventory/types";

export function StockAdjustmentForm({
  business_id,
  branch_id,
  product_id,
  locations,
  loading,
  onSubmit,
}: {
  business_id: string;
  branch_id: string;
  product_id: string;
  locations: ProductStockLocation[];
  loading: boolean;
  onSubmit: (payload: StockAdjustmentPayload) => Promise<void>;
}) {
  const defaultLocationId =
    locations.find((location) => location.isDefault)?.locationId ??
    locations[0]?.locationId ??
    "";
  const [locationId, setLocationId] = useState(defaultLocationId);
  const selectedLocation =
    locations.find((location) => location.locationId === locationId) ?? null;
  const [newQuantity, setNewQuantity] = useState(
    String(selectedLocation?.quantity ?? 0),
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    setLocationId(defaultLocationId);
  }, [defaultLocationId]);

  useEffect(() => {
    setNewQuantity(String(selectedLocation?.quantity ?? 0));
  }, [selectedLocation?.locationId, selectedLocation?.quantity]);

  const numericQuantity = Number(newQuantity);
  const isInvalidQuantity = useMemo(
    () =>
      !selectedLocation ||
      Number.isNaN(numericQuantity) ||
      numericQuantity < 0,
    [numericQuantity, selectedLocation],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajuste manual</CardTitle>
        <CardDescription>
          Elige la ubicacion, define la cantidad fisica y registra el motivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="adjustment-location">Ubicacion</Label>
            <select
              id="adjustment-location"
              className="ui-select"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              {locations.map((location) => (
                <option key={location.locationId} value={location.locationId}>
                  {location.locationName}
                  {location.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-muted/70 p-4 text-sm">
            Stock actual:{" "}
            <span className="font-semibold">
              {formatInventoryQuantity(selectedLocation?.quantity ?? 0)} uds
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-quantity">Nueva cantidad</Label>
          <Input
            id="new-quantity"
            type="number"
            min="0"
            step="0.001"
            value={newQuantity}
            onChange={(event) => setNewQuantity(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Conteo fisico, merma, correccion..."
          />
        </div>

        <Button
          className="w-full"
          disabled={loading || isInvalidQuantity || reason.trim().length === 0}
          onClick={() => {
            if (!selectedLocation) {
              return;
            }

            return onSubmit({
              business_id,
              branch_id,
              location_id: selectedLocation.locationId,
              product_id,
              new_quantity: numericQuantity,
              reason: reason.trim(),
            });
          }}
        >
          {loading ? "Guardando..." : "Guardar ajuste"}
        </Button>
      </CardContent>
    </Card>
  );
}
