import { Input } from "@/components/ui/input";
import type { SaleCartItem, SalePaymentInput } from "@/features/sales/types";
import { calculateCartTotals } from "@/features/sales/utils";
import { cn, formatCurrency } from "@/lib/utils";

export function SaleSummary({
  items,
  saleDiscount,
  payments,
  onSaleDiscountChange,
  className,
}: {
  items: SaleCartItem[];
  saleDiscount: number;
  payments: SalePaymentInput[];
  onSaleDiscountChange: (value: number) => void;
  className?: string;
}) {
  const totals = calculateCartTotals(items, saleDiscount, payments);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.3rem] border border-black/10 bg-primary text-primary-foreground",
        className,
      )}
    >
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
              Total a cobrar
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              {formatCurrency(totals.total)}
            </p>
          </div>

          <div className="rounded-xl bg-white/12 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              Lineas
            </p>
            <p className="mt-1 text-xl font-semibold">{items.length}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <SummaryRow
            label="Subtotal bruto"
            value={formatCurrency(totals.grossSubtotal)}
          />
          <SummaryRow
            label="Descuento lineas"
            value={formatCurrency(totals.lineDiscountTotal)}
          />
          <SummaryRow
            label="Descuento general"
            value={formatCurrency(totals.saleDiscount)}
          />
          <SummaryRow label="Impuestos" value={formatCurrency(totals.taxTotal)} />
        </div>
      </div>

      <div className="border-t border-white/12 bg-black/8 px-4 py-3">
        <label
          htmlFor="sale-discount"
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/70"
        >
          Descuento general
        </label>
        <Input
          id="sale-discount"
          className="mt-2 h-10 border-white/20 bg-white/92 text-foreground"
          type="number"
          min="0"
          step="0.01"
          value={saleDiscount}
          onChange={(event) => onSaleDiscountChange(Number(event.target.value))}
        />
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/8 px-3 py-2">
      <span className="text-primary-foreground/80">{label}</span>
      <span className="font-semibold text-primary-foreground">{value}</span>
    </div>
  );
}
