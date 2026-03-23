"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import { StockLevelCard } from "@/components/inventory/stock-level-card";
import { ProductSearch } from "@/components/pos/product-search";
import {
  useCreateStockAdjustmentMutation,
  useDefaultInventoryLocation,
  useProductStock,
} from "@/features/inventory/hooks";
import type { ProductSearchResult } from "@/features/products/types";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";

export default function InventoryPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id } = useCurrentBusiness();
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchResult | null>(null);
  const defaultLocationQuery = useDefaultInventoryLocation(
    business_id,
    branch_id,
  );
  const stockQuery = useProductStock(
    selectedProduct?.id ?? null,
    business_id,
    branch_id,
    defaultLocationQuery.data?.id,
  );
  const adjustmentMutation = useCreateStockAdjustmentMutation(
    selectedProduct?.id ?? null,
    business_id,
    branch_id,
    defaultLocationQuery.data?.id,
  );

  if (!hydrated) {
    return <LoadingState message="Inicializando inventario..." />;
  }

  if (!business_id || !branch_id) {
    return (
      <ErrorState message="Falta contexto operativo. Configura negocio y sucursal para probar inventario." />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <ProductSearch
          business_id={business_id}
          branch_id={branch_id}
          actionLabel="Seleccionar"
          onSelect={(product) => {
            setSelectedProduct(product);
            toast.success(`${product.name} seleccionado.`);
          }}
        />

        {stockQuery.isLoading && selectedProduct ? (
          <LoadingState message="Consultando stock..." />
        ) : null}
        {stockQuery.error instanceof Error ? (
          <ErrorState message={stockQuery.error.message} />
        ) : null}
        {stockQuery.data ? (
          <StockLevelCard
            product_name={stockQuery.data.product_name}
            quantity={stockQuery.data.quantity}
            location_name={defaultLocationQuery.data?.name}
          />
        ) : null}
      </div>

      <div className="space-y-6">
        {defaultLocationQuery.error instanceof Error ? (
          <ErrorState message={defaultLocationQuery.error.message} />
        ) : null}

        {!selectedProduct || !defaultLocationQuery.data || !stockQuery.data ? (
          <ErrorState message="Selecciona un producto con una ubicación disponible para ajustar inventario." />
        ) : (
          <StockAdjustmentForm
            business_id={business_id}
            branch_id={branch_id}
            location_id={defaultLocationQuery.data.id}
            product_id={selectedProduct.id}
            current_quantity={stockQuery.data.quantity}
            loading={adjustmentMutation.isPending}
            onSubmit={async (payload) => {
              try {
                await adjustmentMutation.mutateAsync(payload);
                toast.success("Ajuste guardado correctamente.");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "No fue posible guardar el ajuste.",
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
