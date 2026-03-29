"use client";

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
  RealPaymentMethod,
  SalePaymentInput,
} from "@/features/sales/types";
import { formatCurrency } from "@/lib/utils";

const paymentMethodOptions: Array<{
  value: RealPaymentMethod;
  label: string;
}> = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "store_credit", label: "Credito de tienda" },
];

export function PaymentPanel({
  payments,
  notes,
  total,
  receivedTotal,
  remaining,
  change,
  hasUnsupportedChange,
  canSubmit,
  helperMessage,
  loading,
  onAddPayment,
  onUpdatePayment,
  onRemovePayment,
  onNotesChange,
  onSubmit,
}: {
  payments: SalePaymentInput[];
  notes: string;
  total: number;
  receivedTotal: number;
  remaining: number;
  change: number;
  hasUnsupportedChange: boolean;
  canSubmit: boolean;
  helperMessage: string | null;
  loading: boolean;
  onAddPayment: () => void;
  onUpdatePayment: (
    paymentId: string,
    patch: Partial<Omit<SalePaymentInput, "id">>,
  ) => void;
  onRemovePayment: (paymentId: string) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: () => Promise<void>;
}) {
  const paymentDifference = Math.abs(remaining) < 0.009 ? 0 : remaining;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cobro</CardTitle>
        <CardDescription>
          Divide el pago en varios metodos si hace falta. El cambio solo se
          calcula sobre efectivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div
              key={payment.id}
              className="grid gap-3 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-[0.9fr_0.8fr_0.8fr_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor={`payment-method-${payment.id}`}>
                  Metodo {index + 1}
                </Label>
                <select
                  id={`payment-method-${payment.id}`}
                  className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={payment.payment_method}
                  onChange={(event) =>
                    onUpdatePayment(payment.id, {
                      payment_method: event.target.value as RealPaymentMethod,
                    })
                  }
                >
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`payment-amount-${payment.id}`}>
                  {payment.payment_method === "cash"
                    ? "Monto recibido"
                    : "Monto a cobrar"}
                </Label>
                <Input
                  id={`payment-amount-${payment.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={payment.amount}
                  onChange={(event) =>
                    onUpdatePayment(payment.id, {
                      amount: Number(event.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {payment.payment_method === "cash"
                    ? "Si recibes mas efectivo, el cambio se calcula automaticamente."
                    : "Este monto debe coincidir con lo que se cobrara por este metodo."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`payment-reference-${payment.id}`}>
                  Referencia
                </Label>
                <Input
                  id={`payment-reference-${payment.id}`}
                  placeholder="Ultimos digitos o nota"
                  value={payment.reference}
                  onChange={(event) =>
                    onUpdatePayment(payment.id, {
                      reference: event.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={payments.length === 1}
                  onClick={() => onRemovePayment(payment.id)}
                >
                  Quitar
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={onAddPayment}>
            Agregar metodo
          </Button>
        </div>

        <div className="grid gap-3 rounded-2xl bg-muted/70 p-4 text-sm md:grid-cols-3">
          <PaymentMetric label="Total" value={formatCurrency(total)} />
          <PaymentMetric
            label="Recibido"
            value={formatCurrency(receivedTotal)}
          />
          <PaymentMetric
            label={
              hasUnsupportedChange
                ? "Excedente"
                : change > 0
                ? "Cambio"
                : paymentDifference > 0
                  ? "Falta"
                  : "Cobro exacto"
            }
            value={
              hasUnsupportedChange
                ? formatCurrency(Math.max(receivedTotal - total, 0))
                : change > 0
                ? formatCurrency(change)
                : paymentDifference > 0
                  ? formatCurrency(paymentDifference)
                  : formatCurrency(0)
            }
            emphasized={
              !hasUnsupportedChange && change <= 0 && paymentDifference <= 0
            }
          />
        </div>

        {helperMessage ? (
          <p className="text-sm text-muted-foreground">{helperMessage}</p>
        ) : null}

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
          disabled={!canSubmit || loading}
          onClick={() => void onSubmit()}
        >
          {loading ? "Finalizando..." : "Finalizar venta"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PaymentMetric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-base ${emphasized ? "font-semibold" : "font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}
