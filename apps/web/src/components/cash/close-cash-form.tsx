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
import type {
  CashSession,
  CloseCashSessionPayload,
} from "@/features/cash/types";

export function CloseCashForm({
  session,
  loading,
  onSubmit,
}: {
  session: CashSession;
  loading: boolean;
  onSubmit: (payload: CloseCashSessionPayload) => Promise<void>;
}) {
  const [closingCounted, setClosingCounted] = useState(
    String(session.openingAmount),
  );
  const [notes, setNotes] = useState("");

  const numericAmount = Number(closingCounted);
  const isInvalidAmount = useMemo(
    () => Number.isNaN(numericAmount) || numericAmount < 0,
    [numericAmount],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cerrar caja</CardTitle>
        <CardDescription>
          Ingresa el conteo final del efectivo del turno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="closing-counted">Conteo final</Label>
          <Input
            id="closing-counted"
            type="number"
            min="0"
            step="0.01"
            value={closingCounted}
            onChange={(event) => setClosingCounted(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="closing-notes">Notas de cierre</Label>
          <Textarea
            id="closing-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Diferencias, retiros, incidencias"
          />
        </div>

        <Button
          className="w-full"
          variant="destructive"
          disabled={loading || isInvalidAmount}
          onClick={() =>
            onSubmit({
              cash_session_id: session.id,
              closing_counted: numericAmount,
              notes: notes.trim() || undefined,
            })
          }
        >
          {loading ? "Cerrando..." : "Cerrar caja"}
        </Button>
      </CardContent>
    </Card>
  );
}
