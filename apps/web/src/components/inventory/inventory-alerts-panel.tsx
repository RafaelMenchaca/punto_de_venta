"use client";

import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatInventoryQuantity,
  getInventoryAlertStatusLabel,
} from "@/features/inventory/presentation";
import {
  useDismissInventoryAlertMutation,
  useInventoryAlertsQuery,
  useResolveInventoryAlertMutation,
} from "@/features/inventory/hooks";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export function InventoryAlertsPanel({
  businessId,
  branchId,
}: {
  businessId: string;
  branchId: string;
}) {
  const alertsQuery = useInventoryAlertsQuery(businessId, branchId, "active");
  const resolveMutation = useResolveInventoryAlertMutation(businessId, branchId);
  const dismissMutation = useDismissInventoryAlertMutation(businessId, branchId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
        <CardDescription>
          Detecta faltantes rapido y gestiona alertas basicas de stock bajo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertsQuery.error && alertsQuery.data ? (
          <NoticeBanner
            message="No se pudo actualizar la informacion de alertas en este momento."
            actionLabel="Intenta nuevamente"
            onAction={() => void alertsQuery.refetch()}
          />
        ) : null}

        {alertsQuery.error && !alertsQuery.data ? (
          <ErrorState
            message={getFriendlyErrorMessage(
              alertsQuery.error,
              "No se pudieron cargar las alertas.",
            )}
            actionLabel="Reintentar"
            onAction={() => void alertsQuery.refetch()}
          />
        ) : null}

        {alertsQuery.isLoading && !alertsQuery.data ? (
          <LoadingState message="Cargando alertas..." />
        ) : null}

        {!alertsQuery.isLoading &&
        !alertsQuery.error &&
        alertsQuery.data?.length === 0 ? (
          <EmptyState
            title="Sin alertas activas"
            description="No hay alertas activas de stock bajo en este momento."
          />
        ) : null}

        {alertsQuery.data?.length ? (
          <div className="rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
            {alertsQuery.data.length} alerta
            {alertsQuery.data.length === 1 ? "" : "s"} activa
            {alertsQuery.data.length === 1 ? "" : "s"} detectada
          </div>
        ) : null}

        <div className="space-y-3">
          {alertsQuery.data?.map((alert) => {
            const resolving =
              resolveMutation.isPending &&
              resolveMutation.variables?.alertId === alert.id;
            const dismissing =
              dismissMutation.isPending &&
              dismissMutation.variables?.alertId === alert.id;

            return (
              <div
                key={alert.id}
                className="rounded-2xl border border-border bg-white/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{alert.title}</p>
                      <Badge variant="warning">
                        {getInventoryAlertStatusLabel(alert.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {alert.productName ?? "Producto no disponible"}
                      {alert.locationName ? ` | ${alert.locationName}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resolving || dismissing}
                      onClick={async () => {
                        try {
                          await resolveMutation.mutateAsync({
                            alertId: alert.id,
                            payload: {
                              business_id: businessId,
                              branch_id: branchId,
                            },
                          });
                          toast.success("Alerta resuelta.");
                        } catch (error) {
                          toast.error(
                            getFriendlyErrorMessage(
                              error,
                              "No se pudo resolver la alerta.",
                            ),
                          );
                        }
                      }}
                    >
                      {resolving ? "Guardando..." : "Resolver"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={resolving || dismissing}
                      onClick={async () => {
                        try {
                          await dismissMutation.mutateAsync({
                            alertId: alert.id,
                            payload: {
                              business_id: businessId,
                              branch_id: branchId,
                            },
                          });
                          toast.success("Alerta descartada.");
                        } catch (error) {
                          toast.error(
                            getFriendlyErrorMessage(
                              error,
                              "No se pudo descartar la alerta.",
                            ),
                          );
                        }
                      }}
                    >
                      {dismissing ? "Guardando..." : "Descartar"}
                    </Button>
                  </div>
                </div>

                <p className="mt-3 text-sm">{alert.message}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {alert.currentStock !== null ? (
                    <span>
                      Stock actual: {formatInventoryQuantity(alert.currentStock)} uds
                    </span>
                  ) : null}
                  {alert.minStock !== null ? (
                    <span>
                      Minimo: {formatInventoryQuantity(alert.minStock)} uds
                    </span>
                  ) : null}
                  <span>
                    {new Date(alert.createdAt).toLocaleString("es-MX")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
