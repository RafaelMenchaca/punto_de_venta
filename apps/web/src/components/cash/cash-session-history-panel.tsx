"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCashSessionSummaryQuery, useCashSessionsQuery } from "@/features/cash/hooks";
import { formatCurrency } from "@/lib/utils";
import { CashMovementList } from "./cash-movement-list";
import { CashSessionDetailCard } from "./cash-session-detail-card";
import { CashSessionSummaryCard } from "./cash-session-summary-card";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export function CashSessionHistoryPanel({
  businessId,
  branchId,
  registerId,
}: {
  businessId: string;
  branchId: string;
  registerId: string;
}) {
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const sessionsQuery = useCashSessionsQuery({
    businessId,
    branchId,
    registerId,
    status: status === "all" ? null : status,
    dateFrom,
    dateTo,
  });
  const selectedSummaryQuery = useCashSessionSummaryQuery(selectedSessionId);

  const selectedSession = useMemo(
    () =>
      sessionsQuery.data?.find((session) => session.id === selectedSessionId) ??
      null,
    [selectedSessionId, sessionsQuery.data],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de sesiones</CardTitle>
          <CardDescription>
            Consulta sesiones recientes y abre su detalle completo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <select
              className="ui-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Todas</option>
              <option value="open">Abiertas</option>
              <option value="closed">Cerradas</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Desde</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Hasta</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {sessionsQuery.error && !sessionsQuery.data ? (
        <ErrorState
          message={getFriendlyErrorMessage(
            sessionsQuery.error,
            "No se pudo cargar el historial de sesiones.",
          )}
          actionLabel="Reintentar"
          onAction={() => void sessionsQuery.refetch()}
        />
      ) : null}

      {sessionsQuery.error && sessionsQuery.data ? (
        <NoticeBanner
          message="No se pudo actualizar el historial en este momento."
          actionLabel="Intenta nuevamente"
          onAction={() => void sessionsQuery.refetch()}
        />
      ) : null}

      {sessionsQuery.isLoading && !sessionsQuery.data ? (
        <LoadingState message="Cargando sesiones recientes..." />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sesiones</CardTitle>
            <CardDescription>
              Lista operativa de sesiones de caja.
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-3">
            <div className="rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
              {sessionsQuery.data?.length ?? 0} sesion
              {(sessionsQuery.data?.length ?? 0) === 1 ? "" : "es"} en el rango actual
            </div>
            {!sessionsQuery.isLoading && sessionsQuery.data?.length === 0 ? (
              <EmptyState
                title="Sin sesiones"
                description="No hay sesiones que coincidan con los filtros actuales."
              />
            ) : null}

            {sessionsQuery.data?.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedSessionId === session.id
                    ? "border-primary/40 bg-white shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
                    : "border-border bg-white/60 hover:bg-white"
                }`}
                onClick={() => setSelectedSessionId(session.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {session.registerName ?? "Caja"}{" "}
                      {session.registerCode ? (
                        <span className="text-muted-foreground">
                          ({session.registerCode})
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.branchName ?? "Sucursal"} |{" "}
                      {new Date(session.openedAt).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <Badge variant={session.status === "closed" ? "success" : "warning"}>
                    {session.status === "closed" ? "Cerrada" : "Abierta"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <span>Apertura: {formatCurrency(session.openingAmount)}</span>
                  <span>Esperado: {formatCurrency(session.expectedCash ?? 0)}</span>
                  <span>Diferencia: {formatCurrency(session.differenceAmount ?? 0)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedSummaryQuery.isLoading && selectedSessionId ? (
            <LoadingState message="Cargando detalle de sesion..." />
          ) : null}
          {selectedSummaryQuery.error && !selectedSummaryQuery.data && selectedSessionId ? (
            <ErrorState
              message="No se pudo cargar el detalle de la sesion."
              actionLabel="Reintentar"
              onAction={() => void selectedSummaryQuery.refetch()}
            />
          ) : null}
          {selectedSummaryQuery.error && selectedSummaryQuery.data ? (
            <NoticeBanner
              message="No se pudo actualizar el detalle de la sesion en este momento."
              actionLabel="Intenta nuevamente"
              onAction={() => void selectedSummaryQuery.refetch()}
            />
          ) : null}

          {selectedSummaryQuery.data ? (
            <>
              <CashSessionDetailCard summary={selectedSummaryQuery.data} />
              <CashSessionSummaryCard summary={selectedSummaryQuery.data} />
              <CashMovementList movements={selectedSummaryQuery.data.movements} />
            </>
          ) : selectedSession ? (
            <Card>
              <CardHeader>
                <CardTitle>Detalle pendiente</CardTitle>
                <CardDescription>
                  {selectedSession.registerName ?? "Caja"} ya esta lista, pero el
                  detalle completo se carga aparte.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <EmptyState
              title="Selecciona una sesion"
              description="Abre una fila del historial para revisar el cierre y sus movimientos."
            />
          )}
        </div>
      </div>
    </div>
  );
}
