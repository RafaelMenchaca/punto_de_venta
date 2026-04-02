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
    <Card className="overflow-hidden border-white/80 bg-white/92">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            Cobro
          </p>
          <CardTitle>Finalizar venta</CardTitle>
          <CardDescription>
            Organiza montos, referencias y notas con una lectura inmediata de
            recibido, falta o cambio.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[1.65rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(255,255,255,0.92)_42%,rgba(236,228,214,0.58))] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
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
              emphasized
            />
          </div>

          {helperMessage ? (
            <div className="mt-4 rounded-[1.2rem] border border-dashed border-primary/15 bg-white/76 px-4 py-3 text-sm text-muted-foreground">
              {helperMessage}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div
              key={payment.id}
              className="rounded-[1.45rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(236,228,214,0.38))] p-4 shadow-[0_10px_22px_rgba(23,23,23,0.05)]"
            >
              <div className="flex items-center justify-between gap-3">
                <Label
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                  htmlFor={`payment-method-${payment.id}`}
                >
                  Metodo {index + 1}
                </Label>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {payment.payment_method === "cash"
                    ? "Admite cambio"
                    : "Cobro exacto"}
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <select
                    id={`payment-method-${payment.id}`}
                    className="ui-select"
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
                    className="h-12 text-base"
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
                  <p className="text-xs leading-5 text-muted-foreground">
                    {payment.payment_method === "cash"
                      ? "Si recibes mas efectivo, el cambio se calcula automaticamente."
                      : "Este monto debe coincidir con lo que se cobrara por este metodo."}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
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
          className="h-12 w-full text-base"
          disabled={!canSubmit || loading}
          onClick={() => void onSubmit()}
        >
          {loading ? "Finalizando..." : "Cobrar y cerrar venta"}
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
    <div className="rounded-[1.3rem] border border-white/80 bg-white/78 p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 font-semibold tracking-tight ${
          emphasized ? "text-2xl" : "text-xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
