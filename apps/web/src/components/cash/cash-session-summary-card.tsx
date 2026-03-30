import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CashSessionSummary } from "@/features/cash/types";
import { formatCurrency } from "@/lib/utils";

export function CashSessionSummaryCard({
  summary,
}: {
  summary: CashSessionSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de sesion</CardTitle>
        <CardDescription>
          Totales acumulados y efectivo esperado de la caja actual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            label="Ventas totales"
            value={formatCurrency(summary.totals.sales_total)}
          />
          <SummaryMetric
            label="Ventas"
            value={String(summary.totals.sales_count ?? 0)}
          />
          <SummaryMetric
            label="Ventas en efectivo"
            value={formatCurrency(summary.totals.payment_totals.cash)}
          />
          <SummaryMetric
            label="Ventas con tarjeta"
            value={formatCurrency(summary.totals.payment_totals.card)}
          />
          <SummaryMetric
            label="Ventas por transferencia"
            value={formatCurrency(summary.totals.payment_totals.transfer)}
          />
          <SummaryMetric
            label="Ingresos manuales"
            value={formatCurrency(summary.totals.manual_income_total)}
          />
          <SummaryMetric
            label="Retiros"
            value={formatCurrency(summary.totals.manual_expense_total)}
          />
          <SummaryMetric
            label="Pago mixto"
            value={formatCurrency(summary.totals.payment_totals.mixed)}
          />
          <SummaryMetric
            label="Credito tienda"
            value={formatCurrency(summary.totals.payment_totals.store_credit)}
          />
          <SummaryMetric
            label="Efectivo esperado"
            value={formatCurrency(summary.totals.expected_cash)}
            emphasized
          />
        </div>

        {summary.sales?.length ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Ventas de la sesion
            </p>
            <div className="space-y-3">
              {summary.sales.map((sale) => (
                <div
                  key={sale.id}
                  className="rounded-2xl border border-border bg-white/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{sale.folio}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sale.paymentMethodLabel}
                        {" | "}
                        {new Date(sale.createdAt).toLocaleString("es-MX")}
                      </p>
                      {sale.customerName ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Cliente: {sale.customerName}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-semibold">{formatCurrency(sale.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryMetric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 ${emphasized ? "text-2xl font-semibold" : "text-lg font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}
