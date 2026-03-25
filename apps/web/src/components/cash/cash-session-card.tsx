import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CashSession } from "@/features/cash/types";
import { formatCurrency } from "@/lib/utils";

export function CashSessionCard({
  session,
  openedByLabel,
  registerLabel,
}: {
  session: CashSession;
  openedByLabel?: string | null;
  registerLabel?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesion abierta</CardTitle>
        <CardDescription>Caja activa para el turno actual.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Caja
          </p>
          <p className="mt-2 font-medium">{registerLabel ?? "Caja activa"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Apertura
          </p>
          <p className="mt-2 font-medium">
            {formatCurrency(session.openingAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Abierta por
          </p>
          <p className="mt-2 font-medium">
            {openedByLabel ?? "Usuario actual"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Hora
          </p>
          <p className="mt-2 font-medium">
            {new Date(session.openedAt).toLocaleString("es-MX")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
