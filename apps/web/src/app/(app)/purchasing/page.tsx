"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOperatingContext } from "@/features/context/hooks";
import { useInventoryCatalogsQuery } from "@/features/inventory/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import {
  canManagePurchaseOrders,
  canReadPurchasing,
  canReceivePurchasing,
} from "@/lib/authz";
import { formatCurrency } from "@/lib/utils";
import {
  useCancelPurchaseOrderMutation,
  useCreateGoodsReceiptMutation,
  useCreatePurchaseOrderMutation,
  usePurchaseOrderDetailQuery,
  usePurchaseOrdersQuery,
  usePurchasingSuppliersQuery,
  useGoodsReceiptDetailQuery,
  useGoodsReceiptsQuery,
  useSubmitPurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from "@/features/purchasing/hooks";
import type {
  GoodsReceiptListItem,
  GoodsReceiptDetail,
  PurchaseOrderDetail,
  PurchaseOrderListItem,
  PurchasingSupplier,
} from "@/features/purchasing/types";
import {
  formatQuantity,
  getPurchaseOrderStatusLabel,
} from "@/features/purchasing/utils";
import { PurchaseOrderDetailCard } from "@/components/purchasing/purchase-order-detail-card";
import { PurchaseOrderForm } from "@/components/purchasing/purchase-order-form";
import { GoodsReceiptForm } from "@/components/purchasing/goods-receipt-form";
import { SupplierManager } from "@/components/purchasing/supplier-manager";

type PurchasingTab = "orders" | "new-order" | "receipts" | "suppliers";

const EMPTY_PURCHASE_ORDERS: PurchaseOrderListItem[] = [];
const EMPTY_GOODS_RECEIPTS: GoodsReceiptListItem[] = [];
const EMPTY_SUPPLIERS: PurchasingSupplier[] = [];

const matchesTerm = (
  values: Array<string | null | undefined>,
  term: string,
) => {
  const normalizedTerm = term.trim().toLowerCase();

  if (!normalizedTerm) {
    return true;
  }

  return values
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedTerm));
};

export default function PurchasingPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);

  const [activeTab, setActiveTab] = useState<PurchasingTab>("orders");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [receiptSearchTerm, setReceiptSearchTerm] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null,
  );
  const [selectedReceiptOrderId, setSelectedReceiptOrderId] = useState<
    string | null
  >(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [formHighlighted, setFormHighlighted] = useState(false);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const suppliersQuery = usePurchasingSuppliersQuery(business_id, "");
  const ordersQuery = usePurchaseOrdersQuery(business_id, branch_id, "");
  const receiptsQuery = useGoodsReceiptsQuery(business_id, branch_id, "");
  const inventoryCatalogsQuery = useInventoryCatalogsQuery(
    business_id,
    branch_id,
  );

  const selectedOrderDetailQuery = usePurchaseOrderDetailQuery(
    selectedOrderId,
    business_id,
    branch_id,
  );
  const editingOrderDetailQuery = usePurchaseOrderDetailQuery(
    editingOrderId,
    business_id,
    branch_id,
  );
  const selectedReceiptOrderDetailQuery = usePurchaseOrderDetailQuery(
    selectedReceiptOrderId,
    business_id,
    branch_id,
  );
  const selectedReceiptDetailQuery = useGoodsReceiptDetailQuery(
    selectedReceiptId,
    business_id,
    branch_id,
  );

  const createOrderMutation = useCreatePurchaseOrderMutation(
    business_id,
    branch_id,
  );
  const updateOrderMutation = useUpdatePurchaseOrderMutation(
    business_id,
    branch_id,
  );
  const submitOrderMutation = useSubmitPurchaseOrderMutation(
    business_id,
    branch_id,
  );
  const cancelOrderMutation = useCancelPurchaseOrderMutation(
    business_id,
    branch_id,
  );
  const createReceiptMutation = useCreateGoodsReceiptMutation(
    business_id,
    branch_id,
  );
  const role = contextQuery.data?.user.role ?? null;
  const canManageOrders = canManagePurchaseOrders(role);
  const canReceive = canReceivePurchasing(role);
  const tabs = useMemo<Array<{ id: PurchasingTab; label: string }>>(
    () => [
      { id: "orders", label: "Ordenes" },
      ...(canManageOrders
        ? [{ id: "new-order" as const, label: "Nueva orden" }]
        : []),
      { id: "receipts", label: "Recepciones" },
      ...(canManageOrders
        ? [{ id: "suppliers" as const, label: "Proveedores" }]
        : []),
    ],
    [canManageOrders],
  );
  const resolvedActiveTab: PurchasingTab =
    tabs.find((tab) => tab.id === activeTab)?.id ?? tabs[0]?.id ?? "orders";

  const suppliers = suppliersQuery.data ?? EMPTY_SUPPLIERS;
  const orders = ordersQuery.data ?? EMPTY_PURCHASE_ORDERS;
  const receipts = receiptsQuery.data ?? EMPTY_GOODS_RECEIPTS;
  const locations = inventoryCatalogsQuery.data?.locations ?? [];

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        matchesTerm(
          [
            order.folio,
            order.supplierName,
            order.orderedByName,
            order.status,
            order.notes,
          ],
          orderSearchTerm,
        ),
      ),
    [orderSearchTerm, orders],
  );

  const filteredReceipts = useMemo(
    () =>
      receipts.filter((receipt) =>
        matchesTerm(
          [
            receipt.folio,
            receipt.purchaseOrderFolio,
            receipt.supplierName,
            receipt.locationName,
            receipt.notes,
          ],
          receiptSearchTerm,
        ),
      ),
    [receiptSearchTerm, receipts],
  );

  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    },
    [],
  );

  if (!hydrated) {
    return <LoadingState message="Inicializando compras..." />;
  }

  if (!business_id || !branch_id || !register_id) {
    return (
      <ErrorState message="Falta contexto operativo. Selecciona negocio, sucursal y caja para trabajar compras." />
    );
  }

  if (contextQuery.data && !canReadPurchasing(role)) {
    return (
      <ErrorState message="No tienes permiso para consultar compras con el rol actual." />
    );
  }

  const handleStartEditingOrder = (
    order: PurchaseOrderListItem | PurchaseOrderDetail,
  ) => {
    setEditingOrderId(order.id);
    setSelectedOrderId(order.id);
    setActiveTab("new-order");
    setFormHighlighted(true);

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }

    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    highlightTimerRef.current = window.setTimeout(() => {
      setFormHighlighted(false);
    }, 2400);
  };

  const handleReceiveFromOrder = (orderId: string) => {
    setSelectedReceiptOrderId(orderId);
    setActiveTab("receipts");
  };

  const editingErrorMessage =
    editingOrderDetailQuery.error instanceof Error &&
    !editingOrderDetailQuery.data
      ? getFriendlyErrorMessage(
          editingOrderDetailQuery.error,
          "No se pudo cargar la orden para editar.",
        )
      : null;
  const editingOrderReady =
    !editingOrderId || Boolean(editingOrderDetailQuery.data);

  const orderListErrorMessage =
    ordersQuery.error instanceof Error && !ordersQuery.data
      ? getFriendlyErrorMessage(
          ordersQuery.error,
          "No se pudo cargar la lista de ordenes.",
        )
      : null;

  const receiptListErrorMessage =
    receiptsQuery.error instanceof Error && !receiptsQuery.data
      ? getFriendlyErrorMessage(
          receiptsQuery.error,
          "No se pudo cargar la lista de recepciones.",
        )
      : null;

  const suppliersErrorMessage =
    suppliersQuery.error instanceof Error && !suppliersQuery.data
      ? getFriendlyErrorMessage(
          suppliersQuery.error,
          "No se pudo cargar la lista de proveedores.",
        )
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operacion actual</CardTitle>
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
            label="Ubicaciones"
            value={
              inventoryCatalogsQuery.data?.locations.length
                ? `${inventoryCatalogsQuery.data.locations.length} disponibles`
                : "Pendiente"
            }
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-white/70 p-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={resolvedActiveTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {resolvedActiveTab === "orders" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Ordenes recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Buscar folio, proveedor o estado"
                value={orderSearchTerm}
                onChange={(event) => setOrderSearchTerm(event.target.value)}
              />

              {orderListErrorMessage ? (
                <ErrorState
                  message={orderListErrorMessage}
                  actionLabel="Reintentar"
                  onAction={() => void ordersQuery.refetch()}
                />
              ) : null}

              {ordersQuery.error instanceof Error && ordersQuery.data ? (
                <NoticeBanner
                  message="No se pudo actualizar la informacion de ordenes en este momento."
                  actionLabel="Intenta nuevamente"
                  onAction={() => void ordersQuery.refetch()}
                />
              ) : null}

              {ordersQuery.isLoading && !ordersQuery.data ? (
                <LoadingState message="Cargando ordenes..." />
              ) : null}

              {!ordersQuery.isLoading &&
              !orderListErrorMessage &&
              filteredOrders.length === 0 ? (
                <EmptyState
                  title="Sin ordenes"
                  description="Aun no hay ordenes que coincidan con la busqueda actual."
                />
              ) : null}

              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    className={`w-full rounded-2xl border p-4 text-left ${
                      selectedOrderId === order.id
                        ? "border-primary/40 bg-white shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
                        : "border-border bg-white/70"
                    } ${order.status === "cancelled" ? "opacity-80" : ""}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{order.folio}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.supplierName}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        variant={
                          order.status === "cancelled"
                            ? "destructive"
                            : order.status === "received"
                              ? "success"
                              : order.status === "partially_received"
                                ? "warning"
                                : "default"
                        }
                      >
                        {getPurchaseOrderStatusLabel(order.status)}
                      </Badge>
                      <Badge>
                        {order.pendingQuantity > 0
                          ? `Pendiente ${formatQuantity(order.pendingQuantity)} uds`
                          : "Sin pendiente"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <PurchaseOrderDetailCard
            order={selectedOrderDetailQuery.data ?? null}
            loading={selectedOrderDetailQuery.isLoading}
            errorMessage={
              selectedOrderDetailQuery.error instanceof Error &&
              !selectedOrderDetailQuery.data
                ? getFriendlyErrorMessage(
                    selectedOrderDetailQuery.error,
                    "No se pudo cargar el detalle de la orden.",
                  )
                : null
            }
            onRetry={() => void selectedOrderDetailQuery.refetch()}
            onEdit={
              canManageOrders
                ? () => {
                    if (selectedOrderDetailQuery.data?.canEdit) {
                      handleStartEditingOrder(selectedOrderDetailQuery.data);
                    }
                  }
                : undefined
            }
            onSubmit={
              canManageOrders
                ? () => {
                    if (!selectedOrderDetailQuery.data) {
                      return;
                    }

                    void submitOrderMutation
                      .mutateAsync({
                        purchaseOrderId: selectedOrderDetailQuery.data.id,
                        payload: {
                          business_id,
                          branch_id,
                        },
                      })
                      .then(() => {
                        toast.success("Orden enviada.");
                        void selectedOrderDetailQuery.refetch();
                        void ordersQuery.refetch();
                      })
                      .catch((error) => {
                        toast.error(
                          getFriendlyErrorMessage(
                            error,
                            "No se pudo enviar la orden.",
                          ),
                        );
                      });
                  }
                : undefined
            }
            onCancel={
              canManageOrders
                ? () => {
                    if (!selectedOrderDetailQuery.data) {
                      return;
                    }

                    if (
                      !window.confirm(
                        "Se cancelara la orden seleccionada. Deseas continuar?",
                      )
                    ) {
                      return;
                    }

                    void cancelOrderMutation
                      .mutateAsync({
                        purchaseOrderId: selectedOrderDetailQuery.data.id,
                        payload: {
                          business_id,
                          branch_id,
                        },
                      })
                      .then(() => {
                        toast.success("Orden cancelada.");
                        void selectedOrderDetailQuery.refetch();
                        void ordersQuery.refetch();
                      })
                      .catch((error) => {
                        toast.error(
                          getFriendlyErrorMessage(
                            error,
                            "No se pudo cancelar la orden.",
                          ),
                        );
                      });
                  }
                : undefined
            }
            onReceive={
              canReceive
                ? () => {
                    if (selectedOrderDetailQuery.data) {
                      handleReceiveFromOrder(selectedOrderDetailQuery.data.id);
                    }
                  }
                : undefined
            }
          />
        </div>
      ) : null}

      {resolvedActiveTab === "new-order" ? (
        <div ref={formSectionRef} className="space-y-4">
          {suppliersErrorMessage ? (
            <ErrorState
              message={suppliersErrorMessage}
              actionLabel="Reintentar"
              onAction={() => void suppliersQuery.refetch()}
            />
          ) : null}

          {editingOrderId &&
          editingOrderDetailQuery.isLoading &&
          !editingOrderDetailQuery.data ? (
            <LoadingState message="Cargando orden para editar..." />
          ) : null}

          {editingErrorMessage ? (
            <ErrorState
              message={editingErrorMessage}
              actionLabel="Reintentar"
              onAction={() => void editingOrderDetailQuery.refetch()}
            />
          ) : null}

          {editingOrderReady ? (
            <PurchaseOrderForm
              key={editingOrderDetailQuery.data?.id ?? "new-purchase-order"}
              businessId={business_id}
              branchId={branch_id}
              suppliers={suppliers}
              loading={
                createOrderMutation.isPending || updateOrderMutation.isPending
              }
              mode={editingOrderId ? "edit" : "create"}
              initialOrder={editingOrderDetailQuery.data}
              highlight={formHighlighted}
              onCancelEdit={() => {
                if (highlightTimerRef.current) {
                  window.clearTimeout(highlightTimerRef.current);
                }
                setEditingOrderId(null);
                setFormHighlighted(false);
              }}
              onSubmit={async (payload) => {
                try {
                  if (editingOrderId) {
                    const response = await updateOrderMutation.mutateAsync({
                      purchaseOrderId: editingOrderId,
                      payload,
                    });
                    toast.success("Orden actualizada.");
                    setEditingOrderId(null);
                    setSelectedOrderId(response.id);
                    setActiveTab("orders");
                    void ordersQuery.refetch();
                    void selectedOrderDetailQuery.refetch();
                    return;
                  }

                  const response =
                    await createOrderMutation.mutateAsync(payload);
                  toast.success("Orden guardada como borrador.");
                  setSelectedOrderId(response.id);
                  setEditingOrderId(null);
                  setActiveTab("orders");
                  void ordersQuery.refetch();
                } catch (error) {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      editingOrderId
                        ? "No se pudo actualizar la orden."
                        : "No se pudo guardar la orden de compra.",
                    ),
                  );
                }
              }}
            />
          ) : null}
        </div>
      ) : null}

      {resolvedActiveTab === "receipts" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recepciones recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Buscar folio, proveedor o ubicacion"
                value={receiptSearchTerm}
                onChange={(event) => setReceiptSearchTerm(event.target.value)}
              />

              {receiptListErrorMessage ? (
                <ErrorState
                  message={receiptListErrorMessage}
                  actionLabel="Reintentar"
                  onAction={() => void receiptsQuery.refetch()}
                />
              ) : null}

              {receiptsQuery.error instanceof Error && receiptsQuery.data ? (
                <NoticeBanner
                  message="No se pudo actualizar la informacion de recepciones en este momento."
                  actionLabel="Intenta nuevamente"
                  onAction={() => void receiptsQuery.refetch()}
                />
              ) : null}

              {receiptsQuery.isLoading && !receiptsQuery.data ? (
                <LoadingState message="Cargando recepciones..." />
              ) : null}

              {!receiptsQuery.isLoading &&
              !receiptListErrorMessage &&
              filteredReceipts.length === 0 ? (
                <EmptyState
                  title="Sin recepciones"
                  description="Aun no hay recepciones que coincidan con la busqueda actual."
                />
              ) : null}

              <div className="space-y-3">
                {filteredReceipts.map((receipt) => (
                  <button
                    key={receipt.id}
                    type="button"
                    className={`w-full rounded-2xl border p-4 text-left ${
                      selectedReceiptId === receipt.id
                        ? "border-primary/40 bg-white shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
                        : "border-border bg-white/70"
                    }`}
                    onClick={() => setSelectedReceiptId(receipt.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{receipt.folio}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {receipt.supplierName ?? "Sin proveedor"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatQuantity(receipt.totalQuantity)} uds |{" "}
                        {receipt.locationName}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {new Date(receipt.createdAt).toLocaleString("es-MX")}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Elegir orden a recibir</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders
                  .filter((order) => order.pendingQuantity > 0)
                  .map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className={`w-full rounded-2xl border p-4 text-left ${
                        selectedReceiptOrderId === order.id
                          ? "border-primary/40 bg-white shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
                          : "border-border bg-white/70"
                      }`}
                      onClick={() => setSelectedReceiptOrderId(order.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{order.folio}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {order.supplierName}
                          </p>
                        </div>
                        <Badge variant="warning">
                          {formatQuantity(order.pendingQuantity)} uds pendientes
                        </Badge>
                      </div>
                    </button>
                  ))}
              </CardContent>
            </Card>

            {selectedReceiptOrderDetailQuery.error instanceof Error &&
            !selectedReceiptOrderDetailQuery.data ? (
              <ErrorState
                message={getFriendlyErrorMessage(
                  selectedReceiptOrderDetailQuery.error,
                  "No se pudo cargar la orden seleccionada para recibir.",
                )}
                actionLabel="Reintentar"
                onAction={() => void selectedReceiptOrderDetailQuery.refetch()}
              />
            ) : null}

            {selectedReceiptOrderDetailQuery.isLoading &&
            !selectedReceiptOrderDetailQuery.data ? (
              <LoadingState message="Cargando orden seleccionada..." />
            ) : null}

            <GoodsReceiptForm
              key={selectedReceiptOrderDetailQuery.data?.id ?? "new-receipt"}
              businessId={business_id}
              branchId={branch_id}
              order={selectedReceiptOrderDetailQuery.data ?? null}
              locations={locations}
              loading={createReceiptMutation.isPending}
              readOnly={!canReceive}
              onSubmit={async (payload) => {
                try {
                  const response =
                    await createReceiptMutation.mutateAsync(payload);
                  setSelectedReceiptId(response.id);
                  toast.success("Recepcion registrada.");
                  void selectedReceiptOrderDetailQuery.refetch();
                  void receiptsQuery.refetch();
                  void ordersQuery.refetch();
                } catch (error) {
                  toast.error(
                    getFriendlyErrorMessage(
                      error,
                      "No se pudo registrar la recepcion.",
                    ),
                  );
                }
              }}
            />

            <ReceiptDetailCard
              receipt={selectedReceiptDetailQuery.data ?? null}
              loading={selectedReceiptDetailQuery.isLoading}
              errorMessage={
                selectedReceiptDetailQuery.error instanceof Error &&
                !selectedReceiptDetailQuery.data
                  ? getFriendlyErrorMessage(
                      selectedReceiptDetailQuery.error,
                      "No se pudo cargar la recepcion seleccionada.",
                    )
                  : null
              }
              onRetry={() => void selectedReceiptDetailQuery.refetch()}
            />
          </div>
        </div>
      ) : null}

      {resolvedActiveTab === "suppliers" ? (
        suppliersQuery.isLoading && !suppliersQuery.data ? (
          <LoadingState message="Cargando proveedores..." />
        ) : suppliersErrorMessage ? (
          <ErrorState
            message={suppliersErrorMessage}
            actionLabel="Reintentar"
            onAction={() => void suppliersQuery.refetch()}
          />
        ) : (
          <div className="space-y-4">
            {suppliersQuery.error instanceof Error && suppliersQuery.data ? (
              <NoticeBanner
                message="No se pudo actualizar la informacion de proveedores en este momento."
                actionLabel="Intenta nuevamente"
                onAction={() => void suppliersQuery.refetch()}
              />
            ) : null}

            <SupplierManager
              businessId={business_id}
              branchId={branch_id}
              suppliers={suppliers}
            />
          </div>
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

function ReceiptDetailCard({
  receipt,
  loading,
  errorMessage,
  onRetry,
}: {
  receipt: GoodsReceiptDetail | null;
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  if (errorMessage) {
    return (
      <ErrorState
        message={errorMessage}
        actionLabel="Reintentar"
        onAction={onRetry}
      />
    );
  }

  if (loading) {
    return <LoadingState message="Cargando recepcion..." />;
  }

  if (!receipt) {
    return (
      <EmptyState
        title="Selecciona una recepcion"
        description="Elige una recepcion para revisar su detalle."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{receipt.folio}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Orden"
            value={receipt.purchaseOrderFolio ?? "Sin orden"}
          />
          <MetricCard label="Ubicacion" value={receipt.locationName} />
          <MetricCard
            label="Cantidad"
            value={`${formatQuantity(receipt.totalQuantity)} uds`}
          />
        </div>

        <div className="space-y-3">
          {receipt.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-white/60 p-4"
            >
              <p className="font-medium">{item.productName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cantidad: {item.quantity} | Costo:{" "}
                {formatCurrency(item.unitCost)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
