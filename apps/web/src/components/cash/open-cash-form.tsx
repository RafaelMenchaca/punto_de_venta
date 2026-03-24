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
import type { OpenCashSessionPayload } from "@/features/cash/types";

export function OpenCashForm({
  business_id,
  branch_id,
  register_id,
  loading,
  onSubmit,
}: {
  business_id: string;
  branch_id: string;
  register_id: string;
  loading: boolean;
  onSubmit: (payload: OpenCashSessionPayload) => Promise<void>;
}) {
  const [openingAmount, setOpeningAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const numericAmount = Number(openingAmount);
  const isInvalidAmount = useMemo(
    () => Number.isNaN(numericAmount) || numericAmount < 0,
    [numericAmount],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abrir caja</CardTitle>
        <CardDescription>
          Registra el monto inicial para comenzar a vender.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="opening-amount">Monto de apertura</Label>
          <Input
            id="opening-amount"
            type="number"
            min="0"
            step="0.01"
            value={openingAmount}
            onChange={(event) => setOpeningAmount(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="opening-notes">Notas</Label>
          <Textarea
            id="opening-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Observaciones del turno"
          />
        </div>

        <Button
          className="w-full"
          disabled={loading || isInvalidAmount}
          onClick={() =>
            onSubmit({
              business_id,
              branch_id,
              register_id,
              opening_amount: numericAmount,
              notes: notes.trim() || undefined,
            })
          }
        >
          {loading ? "Abriendo..." : "Abrir caja"}
        </Button>
      </CardContent>
    </Card>
  );
}
