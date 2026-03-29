"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CreateProductForm } from "@/components/inventory/create-product-form";
import { InventoryCatalogsPanel } from "@/components/inventory/inventory-catalogs-panel";
import { InventoryEntryForm } from "@/components/inventory/inventory-entry-form";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import { StockLevelCard } from "@/components/inventory/stock-level-card";
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
import { Input } from "@/components/ui/input";
import { useOperatingContext } from "@/features/context/hooks";
import {
  useCreateInventoryEntryMutation,
  useCreateInventoryProductMutation,
  useCreateStockAdjustmentMutation,
  useDefaultInventoryLocation,
  useDeactivateInventoryProductMutation,
  useInventoryCatalogsQuery,
  useInventoryProductDetailQuery,
  useInventoryProductMovementsQuery,
  useInventoryProductsQuery,
  useProductStock,
  useReactivateInventoryProductMutation,
  useUpdateInventoryProductMutation,
} from "@/features/inventory/hooks";
import type { InventoryProductListItem } from "@/features/inventory/types";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { formatCurrency } from "@/lib/utils";

type InventoryTab = "articles" | "form" | "entries" | "catalogs";
type StatusFilter = "all" | "active" | "inactive";

export default function InventoryPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const [activeTab, setActiveTab] = useState<InventoryTab>("articles");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formHighlighted, setFormHighlighted] = useState(false);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const formHighlightTimerRef = useRef<number | null>(null);

  const productsQuery = useInventoryProductsQuery(
    business_id,
    branch_id,
    searchTerm,
    true,
  );
  const catalogsQuery = useInventoryCatalogsQuery(business_id, branch_id);
  const defaultLocationQuery = useDefaultInventoryLocation(
    business_id,
    branch_id,
  );
  const selectedProductDetailQuery = useInventoryProductDetailQuery(
    selectedProductId,
    business_id,
    branch_id,
  );
  const editingProductDetailQuery = useInventoryProductDetailQuery(
    editingProductId,
    business_id,
    branch_id,
  );
  const movementsQuery = useInventoryProductMovementsQuery(
    selectedProductId,
    business_id,
    branch_id,
  );
  const stockQuery = useProductStock(
    selectedProductId,
    business_id,
    branch_id,
    defaultLocationQuery.data?.id,
  );
  const createProductMutation = useCreateInventoryProductMutation(
    business_id,
    branch_id,
  );
  const updateProductMutation = useUpdateInventoryProductMutation(
    business_id,
    branch_id,
  );
  const deactivateProductMutation = useDeactivateInventoryProductMutation(
    business_id,
    branch_id,
  );
  const reactivateProductMutation = useReactivateInventoryProductMutation(
    business_id,
    branch_id,
  );
  const adjustmentMutation = useCreateStockAdjustmentMutation(
    selectedProductId,
    business_id,
    branch_id,
    defaultLocationQuery.data?.id,
  );
  const entryMutation = useCreateInventoryEntryMutation(business_id, branch_id);

  const filteredProducts = useMemo(() => {
    const items = productsQuery.data ?? [];

    if (statusFilter === "all") {
      return items;
    }

    return items.filter((product) =>
      statusFilter === "active" ? product.isActive : !product.isActive,
    );
  }, [productsQuery.data, statusFilter]);

  const selectedProduct =
    productsQuery.data?.find((product) => product.id === selectedProductId) ??
    null;

  useEffect(
    () => () => {
      if (formHighlightTimerRef.current) {
        window.clearTimeout(formHighlightTimerRef.current);
      }
    },
    [],
  );

  if (!hydrated) {
    return <LoadingState message="Inicializando inventario..." />;
  }

  if (!business_id || !branch_id) {
    return (
      <ErrorState message="Falta contexto operativo. Configura negocio y sucursal para operar inventario." />
    );
  }

  const inventoryTabs: Array<{ id: InventoryTab; label: string }> = [
    { id: "articles", label: "Articulos" },
    { id: "form", label: "Alta de articulo" },
    { id: "entries", label: "Entradas" },
    { id: "catalogs", label: "Catalogos" },
  ];

  const handleStartEditing = (product: InventoryProductListItem) => {
    setEditingProductId(product.id);
    setSelectedProductId(product.id);
    setActiveTab("form");
    setFormHighlighted(true);

    if (formHighlightTimerRef.current) {
      window.clearTimeout(formHighlightTimerRef.current);
    }

    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    formHighlightTimerRef.current = window.setTimeout(() => {
      setFormHighlighted(false);
    }, 2400);
  };

  const handleCancelEditing = () => {
    if (formHighlightTimerRef.current) {
      window.clearTimeout(formHighlightTimerRef.current);
    }
    setEditingProductId(null);
    setFormHighlighted(false);
  };

  const articlesLoadMessage =
    productsQuery.error && !productsQuery.data
      ? getFriendlyErrorMessage(
          productsQuery.error,
          "Hubo un problema al cargar los articulos.",
        )
      : null;
  const canRenderProductForm =
    !editingProductId || Boolean(editingProductDetailQuery.data);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operacion actual</CardTitle>
          <CardDescription>
            El inventario se administra dentro del negocio y sucursal activos.
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
            label="Ubicacion default"
            value={defaultLocationQuery.data?.name ?? "Pendiente"}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-white/70 p-2">
        {inventoryTabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "articles" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Articulos</CardTitle>
              <CardDescription>
                Consulta articulos, revisa stock, movimientos y cambia su
                estado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nombre, SKU o barcode"
                />

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Todos" },
                    { id: "active", label: "Activos" },
                    { id: "inactive", label: "Inactivos" },
                  ].map((filter) => (
                    <Button
                      key={filter.id}
                      type="button"
                      variant={
                        statusFilter === filter.id ? "default" : "outline"
                      }
                      onClick={() => setStatusFilter(filter.id as StatusFilter)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {productsQuery.error && productsQuery.data ? (
                <NoticeBanner
                  message="No se pudo actualizar la lista en este momento."
                  actionLabel="Reintentar"
                  onAction={() => void productsQuery.refetch()}
                />
              ) : null}

              {articlesLoadMessage ? (
                <ErrorState
                  message={articlesLoadMessage}
                  actionLabel="Reintentar"
                  onAction={() => void productsQuery.refetch()}
                />
              ) : null}

              {productsQuery.isLoading && !productsQuery.data ? (
                <LoadingState message="Cargando articulos..." />
              ) : null}

              {!productsQuery.isLoading &&
              !articlesLoadMessage &&
              filteredProducts.length === 0 ? (
                <EmptyState
                  title="Sin articulos"
                  description="Ajusta la busqueda o crea un articulo nuevo desde la pestaña correspondiente."
                />
              ) : null}

              <div className="space-y-3">
                {filteredProducts.map((product) => {
                  const deactivateLoading =
                    deactivateProductMutation.isPending &&
                    deactivateProductMutation.variables?.productId ===
                      product.id;
                  const reactivateLoading =
                    reactivateProductMutation.isPending &&
                    reactivateProductMutation.variables?.productId ===
                      product.id;

                  return (
                    <div
                      key={product.id}
                      className={`rounded-2xl border p-4 ${
                        selectedProductId === product.id
                          ? "border-primary/40 bg-white shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
                          : "border-border bg-white/60"
                      } ${product.isActive ? "" : "bg-slate-100/70 text-slate-700"}`}
                    >
                      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_0.9fr_0.9fr_0.8fr_auto]">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{product.name}</p>
                            <Badge
                              variant={
                                product.isActive ? "success" : "destructive"
                              }
                            >
                              {product.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku ?? "sin SKU"} | Barcode:{" "}
                            {product.barcode ?? "sin barcode"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.categoryName ?? "Sin categoria"} |{" "}
                            {product.brandName ?? "Sin marca"}
                          </p>
                        </div>

                        <InfoCell
                          label="Tasa"
                          value={
                            product.taxRateName
                              ? `${product.taxRateName} (${product.taxRate}%)`
                              : "Sin tasa"
                          }
                        />
                        <InfoCell
                          label="Precio"
                          value={formatCurrency(product.unitPrice)}
                        />
                        <InfoCell
                          label="Stock"
                          value={String(product.availableStock)}
                        />
                        <InfoCell
                          label="Costo"
                          value={formatCurrency(product.costPrice)}
                        />

                        <div className="flex flex-wrap items-start justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedProductId(product.id)}
                          >
                            Ver stock y movimientos
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleStartEditing(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant={
                              product.isActive ? "destructive" : "default"
                            }
                            disabled={deactivateLoading || reactivateLoading}
                            onClick={async () => {
                              try {
                                if (product.isActive) {
                                  await deactivateProductMutation.mutateAsync({
                                    productId: product.id,
                                    payload: { business_id },
                                  });
                                  toast.success("Articulo desactivado.");
                                } else {
                                  await reactivateProductMutation.mutateAsync({
                                    productId: product.id,
                                    payload: { business_id },
                                  });
                                  toast.success("Articulo reactivado.");
                                }
                              } catch (error) {
                                toast.error(
                                  getFriendlyErrorMessage(
                                    error,
                                    product.isActive
                                      ? "No se pudo desactivar el articulo."
                                      : "No se pudo reactivar el articulo.",
                                  ),
                                );
                              }
                            }}
                          >
                            {deactivateLoading || reactivateLoading
                              ? "Guardando..."
                              : product.isActive
                                ? "Desactivar"
                                : "Reactivar"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedProductId ? (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                {selectedProductDetailQuery.error &&
                selectedProductDetailQuery.data ? (
                  <NoticeBanner
                    message="No se pudo actualizar la informacion del articulo en este momento."
                    actionLabel="Reintentar"
                    onAction={() => void selectedProductDetailQuery.refetch()}
                  />
                ) : null}

                {selectedProductDetailQuery.error &&
                !selectedProductDetailQuery.data ? (
                  <ErrorState
                    message="No se pudo cargar la informacion del articulo."
                    actionLabel="Reintentar"
                    onAction={() => void selectedProductDetailQuery.refetch()}
                  />
                ) : null}

                {selectedProductDetailQuery.isLoading &&
                !selectedProductDetailQuery.data ? (
                  <LoadingState message="Preparando detalle del articulo..." />
                ) : null}

                {stockQuery.error && stockQuery.data ? (
                  <NoticeBanner
                    message="No se pudo actualizar el stock en este momento."
                    actionLabel="Reintentar"
                    onAction={() => void stockQuery.refetch()}
                  />
                ) : null}

                {stockQuery.data ? (
                  <StockLevelCard
                    product_name={stockQuery.data.product_name}
                    quantity={stockQuery.data.quantity}
                    location_name={defaultLocationQuery.data?.name}
                  />
                ) : selectedProductDetailQuery.data?.trackInventory ? (
                  <LoadingState message="Consultando stock..." />
                ) : (
                  <EmptyState
                    title="Inventario no aplicable"
                    description="El articulo seleccionado no controla inventario."
                  />
                )}

                {selectedProductDetailQuery.data?.trackInventory &&
                defaultLocationQuery.data &&
                stockQuery.data ? (
                  <StockAdjustmentForm
                    business_id={business_id}
                    branch_id={branch_id}
                    location_id={defaultLocationQuery.data.id}
                    product_id={selectedProductId}
                    current_quantity={stockQuery.data.quantity}
                    loading={adjustmentMutation.isPending}
                    onSubmit={async (payload) => {
                      try {
                        const response =
                          await adjustmentMutation.mutateAsync(payload);
                        toast.success(
                          `Ajuste guardado. Diferencia: ${response.difference}.`,
                        );
                      } catch (error) {
                        toast.error(
                          getFriendlyErrorMessage(
                            error,
                            "No se pudo guardar el ajuste.",
                          ),
                        );
                      }
                    }}
                  />
                ) : null}

                {defaultLocationQuery.error ? (
                  <NoticeBanner
                    message="No se pudo resolver la ubicacion por defecto en este momento."
                    actionLabel="Reintentar"
                    onAction={() => void defaultLocationQuery.refetch()}
                  />
                ) : null}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedProduct?.name ??
                      selectedProductDetailQuery.data?.name ??
                      "Movimientos"}
                  </CardTitle>
                  <CardDescription>
                    Historial reciente del articulo seleccionado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {movementsQuery.error && movementsQuery.data ? (
                    <NoticeBanner
                      message="No se pudo actualizar el historial en este momento."
                      actionLabel="Reintentar"
                      onAction={() => void movementsQuery.refetch()}
                    />
                  ) : null}

                  {movementsQuery.error && !movementsQuery.data ? (
                    <ErrorState
                      message="No se pudo cargar el historial del articulo."
                      actionLabel="Reintentar"
                      onAction={() => void movementsQuery.refetch()}
                    />
                  ) : null}

                  {movementsQuery.isLoading && !movementsQuery.data ? (
                    <LoadingState message="Consultando movimientos..." />
                  ) : null}

                  {!movementsQuery.isLoading &&
                  !movementsQuery.error &&
                  movementsQuery.data?.length === 0 ? (
                    <EmptyState
                      title="Sin movimientos"
                      description="Todavia no hay movimientos registrados para este articulo."
                    />
                  ) : null}

                  {movementsQuery.data?.map((movement) => (
                    <div
                      key={movement.id}
                      className="rounded-2xl border border-border bg-white/60 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {movement.movementType.replaceAll("_", " ")}
                        </p>
                        <p className="text-sm font-semibold">
                          {movement.quantity} uds
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {movement.locationName} |{" "}
                        {new Date(movement.createdAt).toLocaleString("es-MX")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Costo: {formatCurrency(movement.unitCost)}
                      </p>
                      {movement.notes ? (
                        <p className="mt-2 text-sm">{movement.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState
              title="Selecciona un articulo"
              description="Usa la lista para revisar stock, movimientos y ajustes."
            />
          )}
        </div>
      ) : null}

      {activeTab === "form" ? (
        <div ref={formSectionRef} className="space-y-4">
          {catalogsQuery.error && !catalogsQuery.data ? (
            <ErrorState
              message="No se pudieron cargar los catalogos del formulario."
              actionLabel="Reintentar"
              onAction={() => void catalogsQuery.refetch()}
            />
          ) : null}

          {editingProductId &&
          editingProductDetailQuery.isLoading &&
          !editingProductDetailQuery.data ? (
            <LoadingState message="Cargando informacion del articulo..." />
          ) : null}

          {editingProductId &&
          editingProductDetailQuery.error &&
          !editingProductDetailQuery.data ? (
            <ErrorState
              message="No se pudo cargar la informacion del articulo para editar."
              actionLabel="Reintentar"
              onAction={() => void editingProductDetailQuery.refetch()}
            />
          ) : null}

          {canRenderProductForm ? (
            <CreateProductForm
              key={editingProductId ?? "create-product-form"}
              business_id={business_id}
              branch_id={branch_id}
              catalogs={catalogsQuery.data}
              loading={
                createProductMutation.isPending ||
                updateProductMutation.isPending
              }
              mode={editingProductId ? "edit" : "create"}
              initialProduct={editingProductDetailQuery.data}
              highlight={formHighlighted}
              onCancelEdit={handleCancelEditing}
              onSubmit={async (payload) => {
                try {
                  if (editingProductId) {
                    await updateProductMutation.mutateAsync({
                      productId: editingProductId,
                      payload,
                    });
                    setEditingProductId(null);
                    setActiveTab("articles");
                    setSelectedProductId(editingProductId);
                    toast.success("Articulo actualizado.");
                    return;
                  }

                  const response =
                    await createProductMutation.mutateAsync(payload);
                  setSelectedProductId(response.product_id);
                  toast.success("Articulo creado correctamente.");
                } catch (error) {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      editingProductId
                        ? "No se pudo actualizar el articulo."
                        : "No se pudo guardar el articulo.",
                    ),
                  );
                }
              }}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === "entries" ? (
        catalogsQuery.data ? (
          <InventoryEntryForm
            business_id={business_id}
            branch_id={branch_id}
            catalogs={catalogsQuery.data}
            loading={entryMutation.isPending}
            onSubmit={async (payload) => {
              try {
                await entryMutation.mutateAsync(payload);
                toast.success("Entrada registrada.");
              } catch (error) {
                toast.error(
                  getFriendlyErrorMessage(
                    error,
                    "No se pudo registrar la entrada.",
                  ),
                );
              }
            }}
          />
        ) : catalogsQuery.isLoading ? (
          <LoadingState message="Cargando catalogos para entradas..." />
        ) : (
          <ErrorState
            message="No se pudieron cargar las opciones para registrar entradas."
            actionLabel="Reintentar"
            onAction={() => void catalogsQuery.refetch()}
          />
        )
      ) : null}

      {activeTab === "catalogs" ? (
        catalogsQuery.data ? (
          <InventoryCatalogsPanel
            business_id={business_id}
            branch_id={branch_id}
            catalogs={catalogsQuery.data}
          />
        ) : catalogsQuery.isLoading ? (
          <LoadingState message="Cargando catalogos..." />
        ) : (
          <ErrorState
            message="No se pudieron cargar los catalogos."
            actionLabel="Reintentar"
            onAction={() => void catalogsQuery.refetch()}
          />
        )
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
