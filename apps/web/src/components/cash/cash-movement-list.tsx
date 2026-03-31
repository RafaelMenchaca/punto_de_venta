import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CashMovement } from "@/features/cash/types";
import { formatCurrency } from "@/lib/utils";

export function CashMovementList({
  movements,
}: {
  movements: CashMovement[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos recientes</CardTitle>
        <CardDescription>
          Historial inmediato de ingresos y retiros de la sesion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aun no hay movimientos manuales registrados.
          </p>
        ) : null}

        {movements.map((movement) => {
          const isIncome = movement.movementType === "income";

          return (
            <div
              key={movement.id}
              className="rounded-[1.35rem] border border-border bg-white/72 p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {isIncome ? "Ingreso" : "Retiro"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {movement.createdByName ?? "Usuario"}
                    {" | "}
                    {new Date(movement.createdAt).toLocaleString("es-MX")}
                  </p>
                  {movement.notes ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {movement.notes}
                    </p>
                  ) : null}
                </div>

                <p
                  className={`text-sm font-semibold ${
                    isIncome ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(movement.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
