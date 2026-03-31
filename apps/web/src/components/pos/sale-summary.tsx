import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SaleCartItem, SalePaymentInput } from "@/features/sales/types";
import { calculateCartTotals } from "@/features/sales/utils";
import { formatCurrency } from "@/lib/utils";

export function SaleSummary({
  items,
  saleDiscount,
  payments,
  onSaleDiscountChange,
}: {
  items: SaleCartItem[];
  saleDiscount: number;
  payments: SalePaymentInput[];
  onSaleDiscountChange: (value: number) => void;
}) {
  const totals = calculateCartTotals(items, saleDiscount, payments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen</CardTitle>
        <CardDescription>
          Descuentos, impuestos y total de la venta actual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="rounded-[1.5rem] bg-primary px-5 py-5 text-primary-foreground shadow-[0_18px_34px_rgba(15,118,110,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Total a cobrar
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">
            {formatCurrency(totals.total)}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <HeroMetric
              label="Subtotal neto"
              value={formatCurrency(totals.subtotal)}
            />
            <HeroMetric
              label="Impuestos"
              value={formatCurrency(totals.taxTotal)}
            />
            <HeroMetric
              label="Descuento total"
              value={formatCurrency(totals.discountTotal)}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_190px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryTile
              label="Subtotal bruto"
              value={formatCurrency(totals.grossSubtotal)}
            />
            <SummaryTile
              label="Descuento por lineas"
              value={formatCurrency(totals.lineDiscountTotal)}
              negative
            />
            <SummaryTile
              label="Subtotal neto"
              value={formatCurrency(totals.subtotal)}
            />
            <SummaryTile
              label="Impuestos"
              value={formatCurrency(totals.taxTotal)}
            />
          </div>

          <div className="rounded-[1.35rem] border border-border bg-white/72 p-4">
            <label
              htmlFor="sale-discount"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
            >
              Descuento general
            </label>
            <Input
              id="sale-discount"
              className="mt-3"
              type="number"
              min="0"
              step="0.01"
              value={saleDiscount}
              onChange={(event) =>
                onSaleDiscountChange(Number(event.target.value))
              }
            />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Se aplica al total de la venta despues del descuento por lineas.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-primary-foreground">
        {value}
      </p>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] border border-border bg-white/72 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 text-lg font-semibold ${
          negative ? "text-rose-700" : ""
        }`}
      >
        {negative ? `-${value}` : value}
      </p>
    </div>
  );
}
