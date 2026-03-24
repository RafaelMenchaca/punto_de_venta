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
import type { StockAdjustmentPayload } from "@/features/inventory/types";

export function StockAdjustmentForm({
  business_id,
  branch_id,
  location_id,
  product_id,
  current_quantity,
  loading,
  onSubmit,
}: {
  business_id: string;
  branch_id: string;
  location_id: string;
  product_id: string;
  current_quantity: number;
  loading: boolean;
  onSubmit: (payload: StockAdjustmentPayload) => Promise<void>;
}) {
  const [newQuantity, setNewQuantity] = useState(String(current_quantity));
  const [reason, setReason] = useState("");

  useEffect(() => {
    setNewQuantity(String(current_quantity));
  }, [current_quantity]);

  const numericQuantity = Number(newQuantity);
  const isInvalidQuantity = useMemo(
    () => Number.isNaN(numericQuantity) || numericQuantity < 0,
    [numericQuantity],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajuste manual</CardTitle>
        <CardDescription>
          Define la nueva cantidad física y registra el motivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-quantity">Nueva cantidad</Label>
          <Input
            id="new-quantity"
            type="number"
            min="0"
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
            placeholder="Conteo físico, merma, corrección..."
          />
        </div>

        <Button
          className="w-full"
          disabled={loading || isInvalidQuantity || reason.trim().length === 0}
          onClick={() =>
            onSubmit({
              business_id,
              branch_id,
              location_id,
              product_id,
              new_quantity: numericQuantity,
              reason: reason.trim(),
            })
          }
        >
          {loading ? "Guardando..." : "Guardar ajuste"}
        </Button>
      </CardContent>
    </Card>
  );
}
