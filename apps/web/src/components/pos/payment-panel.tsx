"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentMethod } from "@/features/sales/types";
import { formatCurrency } from "@/lib/utils";

export function PaymentPanel({
  payment_method,
  notes,
  total,
  loading,
  onPaymentMethodChange,
  onNotesChange,
  onSubmit,
}: {
  payment_method: PaymentMethod;
  notes: string;
  total: number;
  loading: boolean;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago</CardTitle>
        <CardDescription>
          Selecciona el método de pago y finaliza la venta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-method">Método de pago</Label>
          <select
            id="payment-method"
            className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={payment_method}
            onChange={(event) =>
              onPaymentMethodChange(event.target.value as PaymentMethod)
            }
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
            <option value="mixed">Mixto</option>
            <option value="store_credit">Crédito de tienda</option>
          </select>
        </div>

        <div className="rounded-2xl bg-muted/70 p-4 text-sm">
          <p className="text-muted-foreground">Monto a cobrar</p>
          <p className="mt-2 text-lg font-semibold">{formatCurrency(total)}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sale-notes">Notas</Label>
          <Textarea
            id="sale-notes"
            placeholder="Observaciones de la venta"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </div>

        <Button
          className="w-full"
          disabled={loading || total <= 0}
          onClick={() => void onSubmit()}
        >
          {loading ? "Finalizando..." : "Finalizar venta"}
        </Button>
      </CardContent>
    </Card>
  );
}
