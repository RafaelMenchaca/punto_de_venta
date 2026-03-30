import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CashSessionSummary } from "@/features/cash/types";
import { formatCurrency } from "@/lib/utils";

export function CashSessionDetailCard({
  summary,
}: {
  summary: CashSessionSummary;
}) {
  const difference = summary.session.differenceAmount ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle de sesion</CardTitle>
        <CardDescription>
          Apertura, cierre, diferencia y notas de la sesion seleccionada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Caja"
            value={`${summary.session.registerName} (${summary.session.registerCode})`}
          />
          <Metric label="Sucursal" value={summary.session.branchName} />
          <Metric
            label="Apertura"
            value={formatCurrency(summary.session.openingAmount)}
          />
          <Metric
            label="Estado"
            value={summary.session.status === "closed" ? "Cerrada" : "Abierta"}
          />
          <Metric
            label="Abierta por"
            value={summary.session.openedByName ?? "Sin usuario"}
          />
          <Metric
            label="Hora apertura"
            value={new Date(summary.session.openedAt).toLocaleString("es-MX")}
          />
          <Metric
            label="Hora cierre"
            value={
              summary.session.closedAt
                ? new Date(summary.session.closedAt).toLocaleString("es-MX")
                : "Sesion abierta"
            }
          />
          <Metric
            label="Cerrada por"
            value={summary.session.closedByName ?? "Pendiente"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Esperado cierre"
            value={
              summary.session.closingExpected !== null
                ? formatCurrency(summary.session.closingExpected)
                : formatCurrency(summary.totals.expected_cash)
            }
          />
          <Metric
            label="Contado cierre"
            value={
              summary.session.closingCounted !== null
                ? formatCurrency(summary.session.closingCounted)
                : "Pendiente"
            }
          />
          <Metric
            label="Diferencia"
            value={
              summary.session.differenceAmount !== null
                ? formatCurrency(summary.session.differenceAmount)
                : formatCurrency(difference)
            }
            tone={
              difference < 0 ? "negative" : difference > 0 ? "positive" : "neutral"
            }
          />
        </div>

        {summary.session.notes ? (
          <div className="rounded-2xl border border-border bg-white/60 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Notas
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {summary.session.notes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 font-medium ${
          tone === "positive"
            ? "text-emerald-700"
            : tone === "negative"
              ? "text-red-700"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
