import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
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
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.5rem] bg-primary px-5 py-5 text-primary-foreground shadow-[0_18px_34px_rgba(15,118,110,0.18)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
              Efectivo esperado
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {formatCurrency(summary.totals.expected_cash)}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <HeroMetric
                label="Ventas totales"
                value={formatCurrency(summary.totals.sales_total)}
              />
              <HeroMetric
                label="Ventas"
                value={String(summary.totals.sales_count ?? 0)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label="Ventas en efectivo"
              value={formatCurrency(summary.totals.payment_totals.cash)}
            />
            <MetricCard
              label="Ventas con tarjeta"
              value={formatCurrency(summary.totals.payment_totals.card)}
            />
            <MetricCard
              label="Transferencia"
              value={formatCurrency(summary.totals.payment_totals.transfer)}
            />
            <MetricCard
              label="Pago mixto"
              value={formatCurrency(summary.totals.payment_totals.mixed)}
            />
            <MetricCard
              label="Ingresos manuales"
              value={formatCurrency(summary.totals.manual_income_total)}
              tone={
                summary.totals.manual_income_total > 0 ? "positive" : "neutral"
              }
            />
            <MetricCard
              label="Retiros"
              value={formatCurrency(summary.totals.manual_expense_total)}
              tone={
                summary.totals.manual_expense_total > 0 ? "warning" : "neutral"
              }
            />
            <MetricCard
              label="Credito tienda"
              value={formatCurrency(summary.totals.payment_totals.store_credit)}
            />
          </div>
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

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-primary-foreground">{value}</p>
    </div>
  );
}
