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
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
          <div className="space-y-3">
            <SummaryRow
              label="Subtotal bruto"
              value={formatCurrency(totals.grossSubtotal)}
            />
            <SummaryRow
              label="Descuento por lineas"
              value={formatCurrency(totals.lineDiscountTotal)}
              negative
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="sale-discount"
              className="text-xs uppercase tracking-[0.22em] text-muted-foreground"
            >
              Descuento general
            </label>
            <Input
              id="sale-discount"
              type="number"
              min="0"
              step="0.01"
              value={saleDiscount}
              onChange={(event) =>
                onSaleDiscountChange(Number(event.target.value))
              }
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <SummaryRow
            label="Descuento total"
            value={formatCurrency(totals.discountTotal)}
            negative
          />
          <SummaryRow
            label="Subtotal neto"
            value={formatCurrency(totals.subtotal)}
          />
          <SummaryRow
            label="Impuestos"
            value={formatCurrency(totals.taxTotal)}
          />
          <SummaryRow
            label="Total"
            value={formatCurrency(totals.total)}
            emphasized
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
  negative = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          emphasized
            ? "text-base font-semibold"
            : negative
              ? "font-medium text-rose-700"
              : "font-medium"
        }
      >
        {negative ? `-${value}` : value}
      </span>
    </div>
  );
}
