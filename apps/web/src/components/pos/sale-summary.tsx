import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SaleCartItem } from "@/features/sales/types";
import { formatCurrency } from "@/lib/utils";

export function calculateCartTotals(items: SaleCartItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const taxTotal = items.reduce(
    (sum, item) =>
      sum + item.unit_price * item.quantity * (item.tax_rate / 100),
    0,
  );
  const total = subtotal + taxTotal;

  return { subtotal, taxTotal, total };
}

export function SaleSummary({ items }: { items: SaleCartItem[] }) {
  const totals = calculateCartTotals(items);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen</CardTitle>
        <CardDescription>Subtotal, impuestos y total actual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Impuestos</span>
          <span>{formatCurrency(totals.taxTotal)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
