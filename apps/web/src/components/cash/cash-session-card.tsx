import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { CashSession } from "@/features/cash/types";

export function CashSessionCard({ session }: { session: CashSession }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesión abierta</CardTitle>
        <CardDescription>Caja activa para el turno actual.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Sesión
          </p>
          <p className="mt-2 font-medium">{session.id.slice(0, 8)}</p>
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
          <p className="mt-2 font-medium">{session.openedBy.slice(0, 8)}</p>
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
