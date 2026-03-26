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
import type { CreateCashMovementPayload } from "@/features/cash/types";

export function CashMovementForm({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (payload: CreateCashMovementPayload) => Promise<void>;
}) {
  const [movementType, setMovementType] = useState<"income" | "expense">(
    "income",
  );
  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const numericAmount = Number(amount);
  const isInvalidAmount = useMemo(
    () => Number.isNaN(numericAmount) || numericAmount <= 0,
    [numericAmount],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimiento de caja</CardTitle>
        <CardDescription>
          Registra ingresos o retiros manuales sobre la sesion abierta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="movement-type">Tipo de movimiento</Label>
          <select
            id="movement-type"
            className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={movementType}
            onChange={(event) =>
              setMovementType(event.target.value as "income" | "expense")
            }
          >
            <option value="income">Ingreso</option>
            <option value="expense">Retiro</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="movement-amount">Monto</Label>
          <Input
            id="movement-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="movement-notes">Notas</Label>
          <Textarea
            id="movement-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Motivo opcional del ingreso o retiro"
          />
        </div>

        <Button
          className="w-full"
          disabled={loading || isInvalidAmount}
          onClick={async () => {
            await onSubmit({
              movement_type: movementType,
              amount: numericAmount,
              notes: notes.trim() || undefined,
            });
            setAmount("0");
            setNotes("");
            setMovementType("income");
          }}
        >
          {loading ? "Guardando..." : "Registrar movimiento"}
        </Button>
      </CardContent>
    </Card>
  );
}
