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
import { formatCurrency } from "@/lib/utils";

export function CloseCashForm({
  session,
  expectedCash,
  loading,
  onSubmit,
}: {
  session: CashSession;
  expectedCash: number;
  loading: boolean;
  onSubmit: (payload: CloseCashSessionPayload) => Promise<void>;
}) {
  const [closingCounted, setClosingCounted] = useState(String(expectedCash));
  const [notes, setNotes] = useState("");

  const numericAmount = Number(closingCounted);
  const isInvalidAmount = useMemo(
    () => Number.isNaN(numericAmount) || numericAmount < 0,
    [numericAmount],
  );
  const difference = useMemo(
    () =>
      Number.isNaN(numericAmount)
        ? 0
        : Math.round((numericAmount - expectedCash + Number.EPSILON) * 100) /
          100,
    [expectedCash, numericAmount],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cerrar caja</CardTitle>
        <CardDescription>
          Captura el efectivo contado y revisa la diferencia antes de cerrar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border bg-white/60 p-4">
          <p className="text-sm text-muted-foreground">Efectivo esperado</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(expectedCash)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="closing-counted">Efectivo contado</Label>
          <Input
            id="closing-counted"
            type="number"
            min="0"
            step="0.01"
            value={closingCounted}
            onChange={(event) => setClosingCounted(event.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-border bg-white/60 p-4">
          <p className="text-sm text-muted-foreground">Diferencia</p>
          <p
            className={`mt-2 text-xl font-semibold ${
              difference < 0
                ? "text-red-700"
                : difference > 0
                  ? "text-emerald-700"
                  : ""
            }`}
          >
            {formatCurrency(difference)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="closing-notes">Notas de cierre</Label>
          <Textarea
            id="closing-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Diferencias, retiros o incidencias"
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
