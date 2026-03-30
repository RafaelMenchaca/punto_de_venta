"use client";

import { useState } from "react";
import { CashSessionsReportPanel } from "@/components/reports/cash-sessions-report-panel";
import { InventoryValuationReportPanel } from "@/components/reports/inventory-valuation-report-panel";
import { SalesReportPanel } from "@/components/reports/sales-report-panel";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOperatingContext } from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { canAccessReports } from "@/lib/authz";

type ReportsTab = "sales" | "cash" | "inventory";

export default function ReportsPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const [activeTab, setActiveTab] = useState<ReportsTab>("sales");
  const role = contextQuery.data?.user.role ?? null;

  if (!hydrated) {
    return <LoadingState message="Inicializando reportes..." />;
  }

  if (!business_id || !branch_id || !register_id) {
    return (
      <ErrorState message="Selecciona negocio, sucursal y caja para consultar reportes." />
    );
  }

  if (contextQuery.data && !canAccessReports(role)) {
    return (
      <ErrorState message="No tienes permiso para consultar reportes con el rol actual." />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contexto de reportes</CardTitle>
          <CardDescription>
            Los reportes se calculan sobre el negocio y la sucursal activos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Negocio"
            value={
              contextQuery.data?.business?.name ?? "Resolviendo negocio..."
            }
          />
          <MetricCard
            label="Sucursal"
            value={contextQuery.data?.branch?.name ?? "Resolviendo sucursal..."}
          />
          <MetricCard
            label="Caja actual"
            value={contextQuery.data?.register?.name ?? "Resolviendo caja..."}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-white/70 p-2">
        <Button
          type="button"
          variant={activeTab === "sales" ? "default" : "outline"}
          onClick={() => setActiveTab("sales")}
        >
          Ventas
        </Button>
        <Button
          type="button"
          variant={activeTab === "cash" ? "default" : "outline"}
          onClick={() => setActiveTab("cash")}
        >
          Caja
        </Button>
        <Button
          type="button"
          variant={activeTab === "inventory" ? "default" : "outline"}
          onClick={() => setActiveTab("inventory")}
        >
          Inventario
        </Button>
      </div>

      {activeTab === "sales" ? (
        <SalesReportPanel
          businessId={business_id}
          branchId={branch_id}
          registerId={register_id}
        />
      ) : null}

      {activeTab === "cash" ? (
        <CashSessionsReportPanel
          businessId={business_id}
          branchId={branch_id}
          registerId={register_id}
        />
      ) : null}

      {activeTab === "inventory" ? (
        <InventoryValuationReportPanel
          businessId={business_id}
          branchId={branch_id}
        />
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
