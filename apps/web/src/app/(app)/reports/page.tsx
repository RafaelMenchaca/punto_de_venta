"use client";

import { useState } from "react";
import { CashSessionsReportPanel } from "@/components/reports/cash-sessions-report-panel";
import { InventoryValuationReportPanel } from "@/components/reports/inventory-valuation-report-panel";
import { SalesReportPanel } from "@/components/reports/sales-report-panel";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MetricCard } from "@/components/shared/metric-card";
import { ModuleHeader } from "@/components/shared/module-header";
import { SegmentedTabs } from "@/components/shared/segmented-tabs";
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
      <ModuleHeader
        eyebrow="Reportes"
        title="Lectura rapida del negocio"
        description="Consulta ventas, caja e inventario valorizado con un formato mas claro para revisar dinero, cierres y stock sin perder tiempo entre tablas densas."
      >
        <MetricCard
          label="Negocio"
          value={contextQuery.data?.business?.name ?? "Resolviendo negocio..."}
        />
        <MetricCard
          label="Sucursal"
          value={contextQuery.data?.branch?.name ?? "Resolviendo sucursal..."}
        />
        <MetricCard
          label="Caja actual"
          value={contextQuery.data?.register?.name ?? "Resolviendo caja..."}
        />
      </ModuleHeader>

      <SegmentedTabs
        items={[
          { id: "sales", label: "Ventas" },
          { id: "cash", label: "Caja" },
          { id: "inventory", label: "Inventario" },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

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
