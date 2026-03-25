"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreateProductForm } from "@/components/inventory/create-product-form";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import { StockLevelCard } from "@/components/inventory/stock-level-card";
import { ProductSearch } from "@/components/pos/product-search";
import { EmptyState } from "@/components/shared/empty-state";
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
import {
  useCreateInventoryProductMutation,
  useCreateStockAdjustmentMutation,
  useDeactivateInventoryProductMutation,
  useDefaultInventoryLocation,
  useProductStock,
} from "@/features/inventory/hooks";
import type { ProductSearchResult } from "@/features/products/types";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { formatCurrency } from "@/lib/utils";

export default function InventoryPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchResult | null>(null);
  const defaultLocationQuery = useDefaultInventoryLocation(
    business_id,
    branch_id,
  );
  const createProductMutation = useCreateInventoryProductMutation(
    business_id,
    branch_id,
  );
  const stockQuery = useProductStock(
    selectedProduct?.id ?? null,
    business_id,
    branch_id,
    defaultLocationQuery.data?.id,
  );
  const deactivateProductMutation = useDeactivateInventoryProductMutation(
    selectedProduct?.id ?? null,
    business_id,
    branch_id,
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
      <ErrorState message="Falta contexto operativo. Configura negocio y sucursal para operar inventario." />
    );
  }

  const selectedProductTracksInventory =
    stockQuery.data?.track_inventory ?? selectedProduct?.trackInventory ?? false;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Operacion actual</CardTitle>
            <CardDescription>
              El inventario se esta gestionando sobre el negocio y sucursal activos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
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
                Ubicacion por defecto
              </p>
              <p className="mt-2 font-medium">
                {defaultLocationQuery.data?.name ?? "Sin resolver"}
              </p>
            </div>
          </CardContent>
        </Card>

        <ProductSearch
          business_id={business_id}
          branch_id={branch_id}
          minimumQueryLength={0}
          actionLabel="Seleccionar"
          onSelect={(product) => {
            setSelectedProduct(product);
            toast.success(`${product.name} seleccionado.`);
          }}
        />

        {defaultLocationQuery.isLoading ? (
          <LoadingState message="Resolviendo ubicacion por defecto..." />
        ) : null}
        {defaultLocationQuery.error instanceof Error ? (
          <ErrorState
            message={defaultLocationQuery.error.message}
            actionLabel="Reintentar"
            onAction={() => void defaultLocationQuery.refetch()}
          />
        ) : null}

        {!selectedProduct ? (
          <EmptyState
            title="Selecciona un producto"
            description="Busca un producto para consultar su stock, ajustarlo o desactivarlo."
          />
        ) : null}

        {stockQuery.isLoading && selectedProduct ? (
          <LoadingState message="Consultando stock..." />
        ) : null}
        {stockQuery.error instanceof Error ? (
          <ErrorState
            message={stockQuery.error.message}
            actionLabel="Reintentar"
            onAction={() => void stockQuery.refetch()}
          />
        ) : null}

        {selectedProduct ? (
          <Card>
            <CardHeader>
              <CardTitle>{selectedProduct.name}</CardTitle>
              <CardDescription>
                SKU {selectedProduct.sku ?? "sin SKU"}
                {selectedProduct.categoryName || selectedProduct.brandName
                  ? ` | ${[selectedProduct.categoryName, selectedProduct.brandName]
                      .filter(Boolean)
                      .join(" | ")}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
                  <p className="text-muted-foreground">Precio de venta</p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(selectedProduct.unitPrice)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
                  <p className="text-muted-foreground">Controla inventario</p>
                  <p className="mt-2 text-lg font-semibold">
                    {selectedProductTracksInventory ? "Si" : "No"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                disabled={deactivateProductMutation.isPending}
                onClick={async () => {
                  try {
                    const response =
                      await deactivateProductMutation.mutateAsync({
                        business_id,
                      });
                    setSelectedProduct(null);
                    toast.success(`${response.name} desactivado.`);
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "No fue posible desactivar el producto.",
                    );
                  }
                }}
              >
                {deactivateProductMutation.isPending
                  ? "Desactivando..."
                  : "Desactivar producto"}
              </Button>
            </CardContent>
          </Card>
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
        <CreateProductForm
          business_id={business_id}
          branch_id={branch_id}
          loading={createProductMutation.isPending}
          onSubmit={async (payload) => {
            try {
              const response = await createProductMutation.mutateAsync(payload);
              setSelectedProduct({
                id: response.product_id,
                businessId: business_id,
                name: response.name,
                sku: response.sku,
                barcode: payload.barcode ?? null,
                unitPrice: payload.sale_price,
                trackInventory: payload.track_inventory,
                taxRate: 0,
                availableStock: response.initial_stock,
                isActive: true,
                categoryName: null,
                brandName: null,
              });
              toast.success(`${response.name} creado correctamente.`);
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "No fue posible crear el producto.",
              );
            }
          }}
        />

        {!selectedProduct || !defaultLocationQuery.data ? (
          <EmptyState
            title="Ajuste pendiente"
            description="Necesitas una ubicacion activa y un producto seleccionado para guardar un ajuste."
          />
        ) : !selectedProductTracksInventory ? (
          <EmptyState
            title="Inventario no aplicable"
            description="El producto seleccionado no controla inventario. Puedes venderlo, pero no requiere stock ni ajustes."
          />
        ) : !stockQuery.data ? (
          <LoadingState message="Preparando ajuste..." />
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
                const response = await adjustmentMutation.mutateAsync(payload);
                toast.success(
                  `Ajuste guardado. Diferencia: ${response.difference}.`,
                );
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
