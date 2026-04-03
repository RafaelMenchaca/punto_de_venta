"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  RealPaymentMethod,
  SalePaymentInput,
} from "@/features/sales/types";
import { cn, formatCurrency } from "@/lib/utils";

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
  className,
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
  className?: string;
}) {
  const paymentDifference = Math.abs(remaining) < 0.009 ? 0 : remaining;

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[1.3rem] border border-black/10 bg-white/92",
        className,
      )}
    >
      <div className="border-b border-black/8 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Cobro
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <PaymentMetric label="Recibido" value={formatCurrency(receivedTotal)} />
          <PaymentMetric
            label={
              hasUnsupportedChange
                ? "Excedente"
                : change > 0
                  ? "Cambio"
                  : paymentDifference > 0
                    ? "Falta"
                    : "Exacto"
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
          />
          <PaymentMetric label="Total" value={formatCurrency(total)} emphasized />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div
              key={payment.id}
              className="rounded-xl border border-black/8 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Metodo {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={payments.length === 1}
                  onClick={() => onRemovePayment(payment.id)}
                >
                  Quitar
                </Button>
              </div>

              <div className="mt-3 space-y-3">
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

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`payment-amount-${payment.id}`}>
                      {payment.payment_method === "cash"
                        ? "Monto recibido"
                        : "Monto a cobrar"}
                    </Label>
                    <Input
                      id={`payment-amount-${payment.id}`}
                      className="h-10"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`payment-reference-${payment.id}`}>
                      Referencia
                    </Label>
                    <Input
                      id={`payment-reference-${payment.id}`}
                      className="h-10"
                      placeholder="Ultimos digitos o nota"
                      value={payment.reference}
                      onChange={(event) =>
                        onUpdatePayment(payment.id, {
                          reference: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={onAddPayment}>
            Agregar metodo
          </Button>

          <div className="space-y-2">
            <Label htmlFor="sale-notes">Notas</Label>
            <Textarea
              id="sale-notes"
              className="min-h-20"
              placeholder="Observaciones de la venta"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-black/8 bg-white px-4 py-3">
        {helperMessage ? (
          <p className="mb-3 text-sm text-muted-foreground">{helperMessage}</p>
        ) : null}

        <Button
          className="h-12 w-full text-base"
          disabled={!canSubmit || loading}
          onClick={() => void onSubmit()}
        >
          {loading ? "Finalizando..." : "Cobrar y cerrar venta"}
        </Button>
      </div>
    </section>
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
    <div
      className={cn(
        "rounded-xl border border-black/8 px-3 py-2",
        emphasized && "bg-primary/6",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 font-semibold", emphasized ? "text-xl" : "text-base")}>
        {value}
      </p>
    </div>
  );
}
