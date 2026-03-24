"use client";

import { toast } from "sonner";
import { CashSessionCard } from "@/components/cash/cash-session-card";
import { CloseCashForm } from "@/components/cash/close-cash-form";
import { OpenCashForm } from "@/components/cash/open-cash-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCloseCashSessionMutation,
  useOpenCashSessionMutation,
  useOpenCashSessionQuery,
} from "@/features/cash/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";

export default function CashPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id, setRegisterId } =
    useCurrentBusiness();
  const openSessionQuery = useOpenCashSessionQuery(
    register_id,
    business_id,
    branch_id,
  );
  const openMutation = useOpenCashSessionMutation(
    register_id,
    business_id,
    branch_id,
  );
  const closeMutation = useCloseCashSessionMutation(
    register_id,
    business_id,
    branch_id,
  );

  if (!hydrated) {
    return <LoadingState message="Inicializando caja..." />;
  }

  if (!business_id || !branch_id) {
    return (
      <ErrorState message="Falta configurar NEXT_PUBLIC_DEV_BUSINESS_ID y NEXT_PUBLIC_DEV_BRANCH_ID para esta fase." />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contexto de caja</CardTitle>
            <CardDescription>
              Puedes cambiar la caja activa mientras no exista selector visual
              completo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              className="h-10 w-full rounded-lg border border-border bg-input px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={register_id ?? ""}
              onChange={(event) => setRegisterId(event.target.value.trim())}
              placeholder="UUID de register"
            />
          </CardContent>
        </Card>

        {openSessionQuery.isLoading ? (
          <LoadingState message="Consultando sesión abierta..." />
        ) : null}
        {openSessionQuery.error instanceof Error ? (
          <ErrorState
            message={openSessionQuery.error.message}
            actionLabel="Reintentar"
            onAction={() => void openSessionQuery.refetch()}
          />
        ) : null}
        {!openSessionQuery.isLoading &&
        !openSessionQuery.error &&
        !openSessionQuery.data ? (
          <EmptyState
            title="Sin sesión abierta"
            description="Esta caja todavía no tiene un turno abierto. Puedes abrirla desde el panel derecho."
          />
        ) : null}
        {openSessionQuery.data ? (
          <CashSessionCard session={openSessionQuery.data} />
        ) : null}
      </div>

      <div className="space-y-6">
        {!register_id ? (
          <ErrorState message="Necesitas definir una caja para operar." />
        ) : openSessionQuery.data ? (
          <CloseCashForm
            key={openSessionQuery.data.id}
            session={openSessionQuery.data}
            loading={closeMutation.isPending}
            onSubmit={async (payload) => {
              try {
                const response = await closeMutation.mutateAsync(payload);
                toast.success(
                  `Caja cerrada. Diferencia: ${response.difference_amount.toFixed(2)}`,
                );
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "No fue posible cerrar la caja.",
                );
              }
            }}
          />
        ) : (
          <OpenCashForm
            business_id={business_id}
            branch_id={branch_id}
            register_id={register_id}
            loading={openMutation.isPending}
            onSubmit={async (payload) => {
              try {
                await openMutation.mutateAsync(payload);
                toast.success("Caja abierta correctamente.");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "No fue posible abrir la caja.",
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
