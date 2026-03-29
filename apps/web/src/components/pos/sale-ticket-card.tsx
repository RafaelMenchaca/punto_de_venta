import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SaleDetailResponse } from "@/features/sales/types";
import { formatCurrency } from "@/lib/utils";

export function SaleTicketCard({
  sale,
  title = "Resumen de venta",
  description = "Detalle simple y legible de la operacion seleccionada.",
}: {
  sale: SaleDetailResponse | null;
  title?: string;
  description?: string;
}) {
  if (!sale) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusVariant(sale.sale.status)}>
              {getStatusLabel(sale.sale.status)}
            </Badge>
            <Badge variant="default">{sale.sale.paymentSummary.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <TicketMetric label="Folio" value={sale.sale.folio} />
          <TicketMetric
            label="Fecha"
            value={new Date(sale.sale.createdAt).toLocaleString("es-MX")}
          />
          <TicketMetric
            label="Sucursal"
            value={sale.sale.branchName ?? "Sucursal actual"}
          />
          <TicketMetric
            label="Caja"
            value={sale.sale.registerName ?? "Caja activa"}
          />
          <TicketMetric
            label="Cajero"
            value={sale.sale.cashier.fullName ?? "Usuario actual"}
          />
          <TicketMetric
            label="Cliente"
            value={sale.sale.customer?.fullName ?? "Publico general"}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-white/70 p-4">
          {sale.items.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 border-b border-border/70 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr]"
            >
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.sku ?? "sin SKU"}
                </p>
              </div>
              <TicketMetric label="Cantidad" value={String(item.quantity)} />
              <TicketMetric
                label="Precio"
                value={formatCurrency(item.unitPrice)}
              />
              <TicketMetric label="Total" value={formatCurrency(item.total)} />
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl bg-muted/70 p-4">
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(sale.sale.subtotal)}
          />
          <SummaryRow
            label="Descuentos"
            value={formatCurrency(sale.sale.discountTotal)}
          />
          <SummaryRow
            label="Impuestos"
            value={formatCurrency(sale.sale.taxTotal)}
          />
          <SummaryRow
            label="Total"
            value={formatCurrency(sale.sale.total)}
            bold
          />
          {sale.sale.refundedTotal > 0 ? (
            <SummaryRow
              label="Devuelto"
              value={formatCurrency(sale.sale.refundedTotal)}
            />
          ) : null}
          <SummaryRow
            label="Total neto"
            value={formatCurrency(sale.sale.netTotal)}
            bold
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Pagos
          </p>
          {sale.payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 p-4"
            >
              <div>
                <p className="font-medium">{payment.paymentMethodLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {payment.reference ?? "Sin referencia"}
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(payment.amount)}</p>
            </div>
          ))}
        </div>

        {sale.refunds.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Devoluciones registradas
            </p>
            {sale.refunds.map((refund) => (
              <div
                key={refund.id}
                className="rounded-2xl border border-border bg-white/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{refund.folio}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(refund.createdAt).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(refund.total)}
                  </p>
                </div>
                {refund.reason ? (
                  <p className="mt-2 text-sm">{refund.reason}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TicketMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "cancelled":
      return "destructive" as const;
    case "refunded":
    case "partially_refunded":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    case "refunded":
      return "Devuelta";
    case "partially_refunded":
      return "Parcialmente devuelta";
    default:
      return status;
  }
}
