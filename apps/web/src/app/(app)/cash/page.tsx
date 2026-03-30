"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CashMovementForm } from "@/components/cash/cash-movement-form";
import { CashSessionHistoryPanel } from "@/components/cash/cash-session-history-panel";
import { CashMovementList } from "@/components/cash/cash-movement-list";
import { CashSessionCard } from "@/components/cash/cash-session-card";
import { CashSessionSummaryCard } from "@/components/cash/cash-session-summary-card";
import { CloseCashForm } from "@/components/cash/close-cash-form";
import { OpenCashForm } from "@/components/cash/open-cash-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCashSessionSummaryQuery,
  useCloseCashSessionMutation,
  useCreateCashMovementMutation,
  useOpenCashSessionMutation,
  useOpenCashSessionQuery,
} from "@/features/cash/hooks";
import { useOperatingContext } from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export default function CashPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const openSessionQuery = useOpenCashSessionQuery(
    register_id,
    business_id,
    branch_id,
  );
  const summaryQuery = useCashSessionSummaryQuery(
    openSessionQuery.data?.id ?? null,
  );
  const openMutation = useOpenCashSessionMutation(
    register_id,
    business_id,
    branch_id,
  );
  const movementMutation = useCreateCashMovementMutation(
    openSessionQuery.data?.id ?? null,
    register_id,
    business_id,
    branch_id,
  );
  const closeMutation = useCloseCashSessionMutation(
    register_id,
    business_id,
    branch_id,
    openSessionQuery.data?.id ?? null,
  );
  const refreshCashData = () => {
    void openSessionQuery.refetch();

    if (openSessionQuery.data?.id) {
      void summaryQuery.refetch();
    }
  };

  if (!hydrated) {
    return <LoadingState message="Inicializando caja..." />;
  }

  if (!business_id || !branch_id || !register_id) {
    return (
      <ErrorState message="Selecciona negocio, sucursal y caja para operar la caja." />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Contexto de caja</CardTitle>
              <CardDescription>
                Operacion diaria sobre la seleccion actual.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={refreshCashData}>
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ContextMetric
            label="Negocio"
            value={contextQuery.data?.business?.name ?? "Sin seleccionar"}
          />
          <ContextMetric
            label="Sucursal"
            value={contextQuery.data?.branch?.name ?? "Sin seleccionar"}
          />
          <ContextMetric
            label="Caja"
            value={contextQuery.data?.register?.name ?? "Sin seleccionar"}
          />
          <ContextMetric
            label="Usuario"
            value={contextQuery.data?.user.full_name ?? "Sin resolver"}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-white/70 p-2">
        <Button
          type="button"
          variant={activeTab === "current" ? "default" : "outline"}
          onClick={() => setActiveTab("current")}
        >
          Sesion actual
        </Button>
        <Button
          type="button"
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
        >
          Historial
        </Button>
      </div>

      {activeTab === "current" ? (
        <>
          {openSessionQuery.isLoading && !openSessionQuery.data ? (
            <LoadingState message="Consultando sesion abierta..." />
          ) : null}
          {openSessionQuery.error instanceof Error && !openSessionQuery.data ? (
            <ErrorState
              message="Hubo un problema al cargar los datos de caja."
              actionLabel="Reintentar"
              onAction={() => void openSessionQuery.refetch()}
            />
          ) : null}
          {openSessionQuery.error instanceof Error && openSessionQuery.data ? (
            <NoticeBanner
              message="No se pudo actualizar la informacion en este momento."
              actionLabel="Intenta nuevamente"
              onAction={refreshCashData}
            />
          ) : null}

          {!openSessionQuery.isLoading &&
          !openSessionQuery.error &&
          !openSessionQuery.data ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <EmptyState
                title="Sin sesion abierta"
                description="Esta caja todavia no tiene un turno abierto. Registra el monto de apertura para empezar a vender."
              />

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
                      getFriendlyErrorMessage(
                        error,
                        "No se pudo abrir la caja en este momento.",
                      ),
                    );
                  }
                }}
              />
            </div>
          ) : null}

          {openSessionQuery.data ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <CashSessionCard
                  session={openSessionQuery.data}
                  openedByLabel={contextQuery.data?.user.full_name}
                  registerLabel={
                    contextQuery.data?.register?.name ??
                    contextQuery.data?.register?.code
                  }
                />

                {summaryQuery.isLoading && !summaryQuery.data ? (
                  <LoadingState message="Calculando resumen de sesion..." />
                ) : null}
                {summaryQuery.error instanceof Error && !summaryQuery.data ? (
                  <ErrorState
                    message="No se pudo cargar el resumen de la sesion."
                    actionLabel="Reintentar"
                    onAction={() => void summaryQuery.refetch()}
                  />
                ) : null}
                {summaryQuery.error instanceof Error && summaryQuery.data ? (
                  <NoticeBanner
                    message="No se pudo actualizar la informacion en este momento."
                    actionLabel="Intenta nuevamente"
                    onAction={() => void summaryQuery.refetch()}
                  />
                ) : null}
                {summaryQuery.data ? (
                  <>
                    <CashSessionSummaryCard summary={summaryQuery.data} />
                    <CashMovementList movements={summaryQuery.data.movements} />
                  </>
                ) : null}
              </div>

              <div className="space-y-6">
                <CashMovementForm
                  loading={movementMutation.isPending}
                  onSubmit={async (payload) => {
                    try {
                      await movementMutation.mutateAsync(payload);
                      toast.success("Movimiento registrado.");
                    } catch (error) {
                      const message = getFriendlyErrorMessage(
                        error,
                        "No se pudo registrar el movimiento.",
                      );
                      toast.error(message);
                      throw new Error(message);
                    }
                  }}
                />

                {summaryQuery.data ? (
                  <CloseCashForm
                    key={openSessionQuery.data.id}
                    session={openSessionQuery.data}
                    expectedCash={summaryQuery.data.totals.expected_cash}
                    loading={closeMutation.isPending}
                    onSubmit={async (payload) => {
                      try {
                        const response = await closeMutation.mutateAsync(payload);
                        await openSessionQuery.refetch();
                        toast.success(
                          `Caja cerrada. Diferencia: ${response.difference_amount.toFixed(2)}`,
                        );
                      } catch (error) {
                        toast.error(
                          getFriendlyErrorMessage(
                            error,
                            "No se pudo cerrar la caja.",
                          ),
                        );
                      }
                    }}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <CashSessionHistoryPanel
          businessId={business_id}
          branchId={branch_id}
          registerId={register_id}
        />
      )}
    </div>
  );
}

function ContextMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
