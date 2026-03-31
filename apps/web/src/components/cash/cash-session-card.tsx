import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Sesion abierta</CardTitle>
            <CardDescription>Caja activa para el turno actual.</CardDescription>
          </div>
          <Badge variant={session.status === "open" ? "success" : "warning"}>
            {session.status === "open" ? "Abierta" : "Cerrada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
        {session.notes ? (
          <div className="rounded-[1.25rem] border border-border bg-white/72 p-4 md:col-span-2 xl:col-span-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Notas
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
