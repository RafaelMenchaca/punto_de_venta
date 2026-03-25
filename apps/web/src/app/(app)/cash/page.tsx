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
import { useOperatingContext } from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";

export default function CashPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
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
      <ErrorState message="Falta contexto operativo. Configura negocio y sucursal para abrir o cerrar caja." />
    );
  }

  if (!register_id) {
    return (
      <ErrorState message="No hay una caja configurada para esta operacion. Revisa el contexto de desarrollo o autenticacion." />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contexto de caja</CardTitle>
            <CardDescription>
              Negocio, sucursal, caja y usuario activos para este turno.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Negocio
              </p>
              <p className="mt-2 font-medium">
                {contextQuery.data?.business.name ?? "Resolviendo negocio..."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Sucursal
              </p>
              <p className="mt-2 font-medium">
                {contextQuery.data?.branch.name ?? "Resolviendo sucursal..."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Caja
              </p>
              <p className="mt-2 font-medium">
                {contextQuery.data?.register?.name ?? "Caja sin resolver"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Usuario
              </p>
              <p className="mt-2 font-medium">
                {contextQuery.data?.user.full_name ?? "Usuario sin resolver"}
              </p>
            </div>
          </CardContent>
        </Card>

        {openSessionQuery.isLoading ? (
          <LoadingState message="Consultando sesion abierta..." />
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
            title="Sin sesion abierta"
            description="Esta caja todavia no tiene un turno abierto. Puedes abrirla desde el panel derecho."
          />
        ) : null}
        {openSessionQuery.data ? (
          <CashSessionCard
            session={openSessionQuery.data}
            openedByLabel={contextQuery.data?.user.full_name}
            registerLabel={
              contextQuery.data?.register?.name ?? contextQuery.data?.register?.code
            }
          />
        ) : null}
      </div>

      <div className="space-y-6">
        {openSessionQuery.data ? (
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
