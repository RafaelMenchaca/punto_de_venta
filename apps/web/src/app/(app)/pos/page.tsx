"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CustomerSelector } from "@/components/pos/customer-selector";
import { PaymentPanel } from "@/components/pos/payment-panel";
import { PosCart } from "@/components/pos/pos-cart";
import { PosWorkspaceShell } from "@/components/pos/pos-workspace-shell";
import { ProductSearch } from "@/components/pos/product-search";
import { RefundForm } from "@/components/pos/refund-form";
import { SaleSummary } from "@/components/pos/sale-summary";
import { SaleTicketCard } from "@/components/pos/sale-ticket-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MetricCard } from "@/components/shared/metric-card";
import { ModuleHeader } from "@/components/shared/module-header";
import { NoticeBanner } from "@/components/shared/notice-banner";
import { SegmentedTabs } from "@/components/shared/segmented-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOpenCashSessionQuery } from "@/features/cash/hooks";
import { useOperatingContext } from "@/features/context/hooks";
import {
  useCancelSaleMutation,
  useCreateRefundMutation,
  useCreateSaleMutation,
  useSaleDetailQuery,
  useSalesListQuery,
} from "@/features/sales/hooks";
import { getSaleStatusLabel } from "@/features/sales/presentation";
import type {
  RealPaymentMethod,
  SaleDetailResponse,
  SaleListItem,
} from "@/features/sales/types";
import { calculateCartTotals } from "@/features/sales/utils";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { canAccessPos } from "@/lib/authz";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

type PosTab = "sale" | "history" | "refunds";

const matchesSaleSearch = (sale: SaleListItem, term: string) => {
  const normalizedTerm = term.trim().toLowerCase();

  if (!normalizedTerm) {
    return true;
  }

  const saleDate = new Date(sale.createdAt).toLocaleDateString("es-MX");

  return [sale.folio, sale.customerName, sale.cashierName, saleDate]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedTerm));
};

export default function PosPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
  const openSessionQuery = useOpenCashSessionQuery(
    register_id,
    business_id,
    branch_id,
  );
  const salesListQuery = useSalesListQuery(business_id, branch_id, "", 30);
  const createSaleMutation = useCreateSaleMutation(
    register_id,
    business_id,
    branch_id,
  );
  const cancelSaleMutation = useCancelSaleMutation(
    register_id,
    business_id,
    branch_id,
  );
  const createRefundMutation = useCreateRefundMutation(
    register_id,
    business_id,
    branch_id,
  );
  const role = contextQuery.data?.user.role ?? null;

  const [activeTab, setActiveTab] = useState<PosTab>("sale");
  const [saleError, setSaleError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<SaleDetailResponse | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [refundSearch, setRefundSearch] = useState("");
  const [selectedHistorySaleId, setSelectedHistorySaleId] = useState<
    string | null
  >(null);
  const [selectedRefundSaleId, setSelectedRefundSaleId] = useState<
    string | null
  >(null);
  const [refundValues, setRefundValues] = useState<Record<string, string>>({});
  const [refundReason, setRefundReason] = useState("");
  const [minimizedWorkspaceSessionId, setMinimizedWorkspaceSessionId] =
    useState<string | null>(null);

  const historyDetailQuery = useSaleDetailQuery(
    selectedHistorySaleId,
    business_id,
    branch_id,
  );
  const refundDetailQuery = useSaleDetailQuery(
    selectedRefundSaleId,
    business_id,
    branch_id,
  );

  const items = useCartStore((state) => state.items);
  const selectedCustomer = useCartStore((state) => state.selected_customer);
  const saleDiscount = useCartStore((state) => state.sale_discount);
  const paymentLines = useCartStore((state) => state.payment_lines);
  const notes = useCartStore((state) => state.notes);
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateLineDiscount = useCartStore((state) => state.updateLineDiscount);
  const setSelectedCustomer = useCartStore(
    (state) => state.setSelectedCustomer,
  );
  const setSaleDiscount = useCartStore((state) => state.setSaleDiscount);
  const addPaymentLine = useCartStore((state) => state.addPaymentLine);
  const removePaymentLine = useCartStore((state) => state.removePaymentLine);
  const updatePaymentLineMethod = useCartStore(
    (state) => state.updatePaymentLineMethod,
  );
  const updatePaymentLineAmount = useCartStore(
    (state) => state.updatePaymentLineAmount,
  );
  const updatePaymentLineReference = useCartStore(
    (state) => state.updatePaymentLineReference,
  );
  const replacePaymentLines = useCartStore(
    (state) => state.replacePaymentLines,
  );
  const setNotes = useCartStore((state) => state.setNotes);

  const totals = calculateCartTotals(items, saleDiscount, paymentLines);
  const paymentHelperMessage = totals.hasUnsupportedChange
    ? "Solo el efectivo puede exceder el total para calcular cambio."
    : totals.remaining > 0.009
      ? `Faltan ${formatCurrency(totals.remaining)} para completar el cobro.`
      : totals.change > 0
        ? `Cambio estimado: ${formatCurrency(totals.change)}.`
        : totals.total > 0
          ? "Cobro listo para finalizar."
          : "Agrega productos para preparar el cobro.";

  useEffect(() => {
    if (
      paymentLines.length === 1 &&
      paymentLines[0]?.amount === 0 &&
      totals.total > 0
    ) {
      replacePaymentLines([{ ...paymentLines[0], amount: totals.total }]);
    }
  }, [paymentLines, replacePaymentLines, totals.total]);

  const filteredHistorySales = useMemo(
    () =>
      (salesListQuery.data ?? []).filter((sale) =>
        matchesSaleSearch(sale, historySearch),
      ),
    [historySearch, salesListQuery.data],
  );
  const filteredRefundSales = useMemo(
    () =>
      (salesListQuery.data ?? []).filter((sale) =>
        matchesSaleSearch(sale, refundSearch),
      ),
    [refundSearch, salesListQuery.data],
  );

  const handleSelectRefundSale = (saleId: string) => {
    setSelectedRefundSaleId(saleId);
    setRefundValues({});
    setRefundReason("");
  };

  const openSession = openSessionQuery.data ?? null;
  const saleTabErrorMessage =
    openSessionQuery.error instanceof Error
      ? getFriendlyErrorMessage(
          openSessionQuery.error,
          "No se pudo cargar la sesion de caja en este momento.",
        )
      : null;
  const saleTabDisabledMessage =
    openSessionQuery.isLoading && !openSession
      ? null
      : saleTabErrorMessage ?? (!openSession ? "Debes abrir caja antes de vender." : null);
  const openSessionLabel = openSession
    ? `Abierta ${new Date(openSession.openedAt).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Pendiente";
  const isOperationalSaleView =
    activeTab === "sale" &&
    Boolean(openSession) &&
    !openSessionQuery.isLoading &&
    !saleTabErrorMessage;
  const isWorkspaceVisible =
    isOperationalSaleView &&
    Boolean(openSession) &&
    minimizedWorkspaceSessionId !== openSession?.id;
  const isWorkspaceMinimized =
    isOperationalSaleView &&
    Boolean(openSession) &&
    minimizedWorkspaceSessionId === openSession?.id;
  const saleWorkspaceStatus =
    items.length === 0
      ? "Esperando captura"
      : totals.isPaymentReady
        ? "Lista para cobrar"
        : "Venta en progreso";
  const saleWorkspaceStatusVariant =
    items.length === 0
      ? "default"
      : totals.isPaymentReady
        ? "success"
        : "warning";

  useEffect(() => {
    document.body.classList.toggle("pos-workspace-active", isWorkspaceVisible);

    return () => {
      document.body.classList.remove("pos-workspace-active");
    };
  }, [isWorkspaceVisible]);

  if (!hydrated) {
    return <LoadingState message="Inicializando POS..." />;
  }

  if (!business_id || !branch_id || !register_id) {
    return (
      <ErrorState message="Falta contexto operativo. Configura negocio, sucursal y caja para vender." />
    );
  }

  if (contextQuery.data && !canAccessPos(role)) {
    return (
      <ErrorState message="No tienes permiso para operar ventas con el rol actual." />
    );
  }

  const posTabs: Array<{ id: PosTab; label: string }> = [
    { id: "sale", label: "Venta" },
    { id: "history", label: "Historial" },
    { id: "refunds", label: "Devoluciones" },
  ];

  const handleClearSale = () => {
    clearCart();
    setSaleError(null);
    toast.success("La venta actual se limpio.");
  };

  return (
    <div className="space-y-6">
      {!isWorkspaceVisible ? (
        <>
          <ModuleHeader
            eyebrow="POS"
            title="Venta, historial y devoluciones"
            description="La venta debe sentirse rapida y ordenada. Aqui se concentran la captura del carrito, el cobro y el seguimiento inmediato de tickets sin salir del modulo."
            actions={
              activeTab === "sale" && items.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSale}
                >
                  Limpiar venta
                </Button>
              ) : undefined
            }
          >
            <MetricCard
              label="Cajero"
              value={
                contextQuery.data?.user.full_name ?? "Resolviendo usuario..."
              }
            />
            <MetricCard
              label="Caja"
              value={contextQuery.data?.register?.name ?? "Caja activa"}
            />
            <MetricCard
              label="Sucursal"
              value={contextQuery.data?.branch?.name ?? "Sucursal actual"}
            />
            <MetricCard
              label="Sesion"
              value={openSessionLabel}
              tone={openSession ? "positive" : "warning"}
            />
          </ModuleHeader>

          <SegmentedTabs
            items={posTabs}
            value={activeTab}
            onChange={setActiveTab}
          />
        </>
      ) : null}

      {isWorkspaceVisible ? (
        <PosWorkspaceShell
          title="POS | Venta actual"
          statusLabel={saleWorkspaceStatus}
          statusVariant={saleWorkspaceStatusVariant}
          metaLabel={`${contextQuery.data?.register?.name ?? "Caja activa"} | ${
            contextQuery.data?.branch?.name ?? "Sucursal actual"
          } | ${contextQuery.data?.user.full_name ?? "Cajero"}`}
          sessionLabel={openSessionLabel}
          lastSaleLabel={lastSale ? `Ultimo ticket ${lastSale.sale.folio}` : null}
          onShowSale={() => setActiveTab("sale")}
          onShowHistory={() => setActiveTab("history")}
          onShowRefunds={() => setActiveTab("refunds")}
          onMinimize={() => {
            if (openSession) {
              setMinimizedWorkspaceSessionId(openSession.id);
            }
          }}
          actions={
            items.length > 0 ? (
              <Button type="button" variant="outline" onClick={handleClearSale}>
                Limpiar venta
              </Button>
            ) : undefined
          }
          main={
            <div className="flex h-full min-h-0 flex-col gap-3">
              {saleError ? (
                <div className="rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {saleError}
                </div>
              ) : null}

              <ProductSearch
                className="shrink-0"
                business_id={business_id}
                branch_id={branch_id}
                disableOutOfStock
                autoFocus
                onSelect={(product) => {
                  const existingItem = items.find(
                    (item) => item.product_id === product.id,
                  );

                  if (
                    product.trackInventory &&
                    existingItem &&
                    existingItem.quantity >= product.availableStock
                  ) {
                    const message =
                      "No puedes agregar mas unidades que el stock disponible.";
                    setSaleError(message);
                    toast.error(message);
                    return;
                  }

                  setSaleError(null);
                  addItem(product);
                  toast.success(`${product.name} agregado al carrito.`);
                }}
              />

              <PosCart
                className="min-h-0 flex-1"
                items={items}
                saleTotal={totals.total}
                onQuantityChange={(productId, quantity) => {
                  const currentItem = items.find(
                    (item) => item.product_id === productId,
                  );

                  if (!currentItem) {
                    return;
                  }

                  const normalizedQuantity = currentItem.track_inventory
                    ? Math.min(
                        Math.max(1, Number.isFinite(quantity) ? quantity : 1),
                        Math.max(1, currentItem.available_stock),
                      )
                    : Math.max(1, Number.isFinite(quantity) ? quantity : 1);

                  if (
                    currentItem.track_inventory &&
                    quantity > currentItem.available_stock
                  ) {
                    const message =
                      "La cantidad solicitada supera el stock disponible.";
                    setSaleError(message);
                    toast.error(message);
                  } else {
                    setSaleError(null);
                  }

                  updateQuantity(productId, normalizedQuantity);
                }}
                onLineDiscountChange={updateLineDiscount}
                onRemove={(productId) => {
                  setSaleError(null);
                  removeItem(productId);
                }}
              />

              <CustomerSelector
                className="shrink-0"
                businessId={business_id}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
                onClearCustomer={() => setSelectedCustomer(null)}
              />
            </div>
          }
          aside={
            <div className="flex h-full min-h-0 flex-col gap-3">
              <SaleSummary
                className="shrink-0"
                items={items}
                saleDiscount={saleDiscount}
                payments={paymentLines}
                onSaleDiscountChange={setSaleDiscount}
              />

              <PaymentPanel
                className="min-h-0 flex-1"
                payments={paymentLines}
                notes={notes}
                total={totals.total}
                receivedTotal={totals.receivedTotal}
                remaining={totals.remaining}
                change={totals.change}
                hasUnsupportedChange={totals.hasUnsupportedChange}
                canSubmit={totals.isPaymentReady}
                helperMessage={paymentHelperMessage}
                loading={createSaleMutation.isPending}
                onAddPayment={addPaymentLine}
                onUpdatePayment={(paymentId, patch) => {
                  if (patch.amount !== undefined) {
                    updatePaymentLineAmount(paymentId, patch.amount);
                  }

                  if (patch.payment_method) {
                    updatePaymentLineMethod(
                      paymentId,
                      patch.payment_method as RealPaymentMethod,
                    );
                  }

                  if (patch.reference !== undefined) {
                    updatePaymentLineReference(paymentId, patch.reference);
                  }
                }}
                onRemovePayment={removePaymentLine}
                onNotesChange={setNotes}
                onSubmit={async () => {
                  if (!openSession) {
                    const message = "Debes abrir caja antes de vender.";
                    setSaleError(message);
                    toast.error(message);
                    return;
                  }

                  if (items.length === 0) {
                    const message = "Agrega al menos un producto al carrito.";
                    setSaleError(message);
                    toast.error(message);
                    return;
                  }

                  if (totals.total <= 0) {
                    const message = "La venta debe tener un total mayor a cero.";
                    setSaleError(message);
                    toast.error(message);
                    return;
                  }

                  if (totals.hasUnsupportedChange) {
                    const message =
                      "Solo el efectivo puede exceder el total para calcular cambio.";
                    setSaleError(message);
                    toast.error(message);
                    return;
                  }

                  if (!totals.isPaymentReady) {
                    const message =
                      totals.remaining > 0.009
                        ? "Aun falta cubrir el total de la venta."
                        : "Revisa los montos antes de finalizar la venta.";
                    setSaleError(message);
                    toast.error(message);
                    return;
                  }

                  try {
                    const response = await createSaleMutation.mutateAsync({
                      business_id,
                      branch_id,
                      register_id,
                      cash_session_id: openSession.id,
                      customer_id: selectedCustomer?.id,
                      notes: notes.trim() || undefined,
                      sale_discount: totals.saleDiscount || undefined,
                      items: items.map((item) => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        line_discount: item.line_discount || undefined,
                      })),
                      payments: totals.appliedPayments.map((payment) => ({
                        payment_method: payment.payment_method,
                        amount: payment.amount,
                        reference: payment.reference.trim() || undefined,
                      })),
                    });
                    setSaleError(null);
                    setLastSale(response);
                    setSelectedHistorySaleId(response.sale.id);
                    clearCart();
                    toast.success(
                      `Venta ${response.sale.folio} registrada correctamente.`,
                    );
                  } catch (error) {
                    const message = getFriendlyErrorMessage(
                      error,
                      "No se pudo completar la venta.",
                    );
                    setSaleError(message);
                    toast.error(message);
                  }
                }}
              />
            </div>
          }
        />
      ) : null}

      {isWorkspaceMinimized ? (
        <WorkspaceResumeStrip
          total={formatCurrency(totals.total)}
          sessionLabel={openSessionLabel}
          onResume={() => setMinimizedWorkspaceSessionId(null)}
        />
      ) : null}

      {activeTab === "sale" && !isOperationalSaleView ? (
        <SalePreparationState
          loading={openSessionQuery.isLoading && !openSession}
          message={saleTabDisabledMessage ?? "Debes abrir caja antes de vender."}
          errorMessage={saleTabErrorMessage}
          cashierLabel={
            contextQuery.data?.user.full_name ?? "Resolviendo usuario..."
          }
          registerLabel={contextQuery.data?.register?.name ?? "Caja activa"}
          branchLabel={contextQuery.data?.branch?.name ?? "Sucursal actual"}
        />
      ) : null}

      {activeTab === "sale" && isWorkspaceMinimized ? (
        <MinimizedWorkspaceState
          total={formatCurrency(totals.total)}
          lineCount={items.length}
          customerLabel={selectedCustomer?.fullName ?? "Venta general"}
          onResume={() => setMinimizedWorkspaceSessionId(null)}
        />
      ) : null}

      {activeTab === "history" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <SalesColumn
            title="Ventas recientes"
            description="Ubica tickets recientes por folio, cliente o fecha."
            sales={filteredHistorySales}
            selectedSaleId={selectedHistorySaleId}
            searchTerm={historySearch}
            onSearchChange={setHistorySearch}
            onSelectSale={setSelectedHistorySaleId}
            loading={salesListQuery.isLoading}
            errorMessage={
              salesListQuery.error
                ? getFriendlyErrorMessage(
                    salesListQuery.error,
                    "No se pudo cargar la lista de ventas.",
                  )
                : null
            }
            onRetry={() => void salesListQuery.refetch()}
          />

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!historyDetailQuery.data?.sale.canRefund}
                onClick={() => {
                  if (historyDetailQuery.data) {
                    handleSelectRefundSale(historyDetailQuery.data.sale.id);
                    setActiveTab("refunds");
                  }
                }}
              >
                Preparar devolucion
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  !historyDetailQuery.data?.sale.canCancel ||
                  cancelSaleMutation.isPending
                }
                onClick={() => {
                  if (!historyDetailQuery.data) {
                    return;
                  }

                  if (
                    !window.confirm(
                      "Se cancelara la venta seleccionada y el stock regresara. Deseas continuar?",
                    )
                  ) {
                    return;
                  }

                  void cancelSaleMutation
                    .mutateAsync(historyDetailQuery.data.sale.id)
                    .then((response) => {
                      setLastSale(response);
                      toast.success("Venta cancelada correctamente.");
                      void historyDetailQuery.refetch();
                      void salesListQuery.refetch();
                    })
                    .catch((error) => {
                      toast.error(
                        getFriendlyErrorMessage(
                          error,
                          "No se pudo cancelar la venta.",
                        ),
                      );
                    });
                }}
              >
                {cancelSaleMutation.isPending
                  ? "Cancelando..."
                  : "Cancelar venta"}
              </Button>
            </div>

            <DetailPanel
              saleDetail={historyDetailQuery.data ?? null}
              loading={historyDetailQuery.isLoading}
              errorMessage={
                historyDetailQuery.error
                  ? getFriendlyErrorMessage(
                      historyDetailQuery.error,
                      "No se pudo cargar el detalle de la venta.",
                    )
                  : null
              }
              onRetry={() => void historyDetailQuery.refetch()}
            />
          </div>
        </div>
      ) : null}

      {activeTab === "refunds" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <SalesColumn
            title="Buscar venta"
            description="Selecciona una venta para registrar una devolucion."
            sales={filteredRefundSales}
            selectedSaleId={selectedRefundSaleId}
            searchTerm={refundSearch}
            onSearchChange={setRefundSearch}
            onSelectSale={handleSelectRefundSale}
            loading={salesListQuery.isLoading}
            errorMessage={
              salesListQuery.error
                ? getFriendlyErrorMessage(
                    salesListQuery.error,
                    "No se pudo cargar la lista de ventas.",
                  )
                : null
            }
            onRetry={() => void salesListQuery.refetch()}
          />

          <div className="space-y-6">
            <DetailPanel
              saleDetail={refundDetailQuery.data ?? null}
              loading={refundDetailQuery.isLoading}
              errorMessage={
                refundDetailQuery.error
                  ? getFriendlyErrorMessage(
                      refundDetailQuery.error,
                      "No se pudo cargar la venta seleccionada.",
                    )
                  : null
              }
              onRetry={() => void refundDetailQuery.refetch()}
            />

            {refundDetailQuery.data ? (
              <RefundForm
                sale={refundDetailQuery.data}
                values={refundValues}
                reason={refundReason}
                loading={createRefundMutation.isPending}
                onValueChange={(saleItemId, value) =>
                  setRefundValues((current) => ({
                    ...current,
                    [saleItemId]: value,
                  }))
                }
                onReasonChange={setRefundReason}
                onSubmit={async () => {
                  const itemsToRefund = refundDetailQuery.data.items
                    .map((item) => ({
                      sale_item_id: item.id,
                      quantity: Number(refundValues[item.id] ?? 0),
                      remaining_quantity: item.remainingQuantity,
                    }))
                    .filter(
                      (item) =>
                        Number.isFinite(item.quantity) && item.quantity > 0,
                    );

                  if (itemsToRefund.length === 0) {
                    toast.error("Selecciona al menos una cantidad valida.");
                    return;
                  }

                  const invalidItem = itemsToRefund.find(
                    (item) => item.quantity > item.remaining_quantity,
                  );

                  if (invalidItem) {
                    toast.error(
                      "Hay cantidades que superan lo disponible para devolver.",
                    );
                    return;
                  }

                  try {
                    const response = await createRefundMutation.mutateAsync({
                      sale_id: refundDetailQuery.data.sale.id,
                      reason: refundReason.trim() || undefined,
                      items: itemsToRefund.map((item) => ({
                        sale_item_id: item.sale_item_id,
                        quantity: item.quantity,
                      })),
                    });
                    setLastSale(response.sale);
                    toast.success(
                      `Devolucion ${response.refund.folio} registrada correctamente.`,
                    );
                    setRefundValues({});
                    setRefundReason("");
                    void refundDetailQuery.refetch();
                    void salesListQuery.refetch();
                  } catch (error) {
                    toast.error(
                      getFriendlyErrorMessage(
                        error,
                        "No se pudo registrar la devolucion.",
                      ),
                    );
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WorkspaceResumeStrip({
  total,
  sessionLabel,
  onResume,
}: {
  total: string;
  sessionLabel: string;
  onResume: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-3 rounded-full border border-black/10 bg-white/96 px-4 py-3 shadow-[0_18px_40px_rgba(23,23,23,0.16)]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          POS minimizado
        </p>
        <p className="text-sm font-medium">
          {sessionLabel} | Total {total}
        </p>
      </div>
      <Button type="button" size="sm" onClick={onResume}>
        Volver a POS
      </Button>
    </div>
  );
}

function MinimizedWorkspaceState({
  total,
  lineCount,
  customerLabel,
  onResume,
}: {
  total: string;
  lineCount: number;
  customerLabel: string;
  onResume: () => void;
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_24px_56px_rgba(23,23,23,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Badge>Modo caja minimizado</Badge>
          <h2 className="text-2xl font-semibold tracking-tight">
            La venta sigue abierta y lista para volver al POS.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            La operacion no se cerro. Puedes restaurar el workspace de cobro en
            cualquier momento.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <CompactMetric label="Total" value={total} emphasized />
          <CompactMetric label="Lineas" value={String(lineCount)} />
          <CompactMetric label="Cliente" value={customerLabel} />
        </div>
      </div>

      <div className="mt-5">
        <Button type="button" onClick={onResume}>
          Volver al modo caja
        </Button>
      </div>
    </section>
  );
}

function SalePreparationState({
  loading,
  message,
  errorMessage,
  cashierLabel,
  registerLabel,
  branchLabel,
}: {
  loading: boolean;
  message: string;
  errorMessage: string | null;
  cashierLabel: string;
  registerLabel: string;
  branchLabel: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,242,235,0.92))] p-5 shadow-[0_24px_56px_rgba(23,23,23,0.08)] md:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_420px]">
        <div className="space-y-5">
          <div className="space-y-3">
            <Badge variant="warning">POS bloqueado</Badge>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-[2rem]">
                Debes abrir caja antes de vender.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                El modulo sigue disponible, pero la operacion de cobro queda
                protegida hasta que exista una sesion de caja abierta para la
                caja actual.
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingState message="Consultando sesion de caja..." />
          ) : errorMessage ? (
            <ErrorState message={errorMessage} />
          ) : (
            <NoticeBanner message={message} />
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <CompactMetric label="Cajero" value={cashierLabel} />
            <CompactMetric label="Caja" value={registerLabel} />
            <CompactMetric label="Sucursal" value={branchLabel} />
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-dashed border-border/80 bg-white/64 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Cuando abras caja
          </p>
          <div className="mt-4 space-y-3">
            <PreparationStep
              title="El buscador tomara el foco"
              description="La experiencia cambiara a un workspace POS maximizado centrado en capturar la venta."
            />
            <PreparationStep
              title="La venta dominara la pantalla"
              description="Las lineas de productos ocuparan el area principal y el panel derecho quedara reservado para total y cobro."
            />
            <PreparationStep
              title="Cobrar sera la accion natural"
              description="Resumen, metodos de pago, cambio y notas quedaran visibles sin competir con la captura."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SalesColumn({
  title,
  description,
  sales,
  selectedSaleId,
  searchTerm,
  onSearchChange,
  onSelectSale,
  loading,
  errorMessage,
  onRetry,
}: {
  title: string;
  description: string;
  sales: SaleListItem[];
  selectedSaleId: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectSale: (saleId: string) => void;
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <Input
            placeholder="Buscar folio, cliente o fecha"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <div className="rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
            {sales.length} resultado{sales.length === 1 ? "" : "s"}
          </div>
        </div>
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            actionLabel="Reintentar"
            onAction={onRetry}
          />
        ) : null}
        {loading ? <LoadingState message="Cargando ventas..." /> : null}
        {!loading && !errorMessage && sales.length === 0 ? (
          <EmptyState
            title="Sin ventas"
            description="No hay ventas que coincidan con la busqueda actual."
          />
        ) : null}
        <div className="space-y-3">
          {sales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              className={`w-full rounded-2xl border p-4 text-left ${
                selectedSaleId === sale.id
                  ? "border-primary/40 bg-white shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
                  : "border-border bg-white/70 hover:bg-white"
              }`}
              onClick={() => onSelectSale(sale.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{sale.folio}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sale.customerName ?? "Publico general"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(sale.netTotal)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sale.paymentSummary.label}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant={
                    sale.status === "cancelled"
                      ? "destructive"
                      : sale.status === "partially_refunded" ||
                          sale.status === "refunded"
                        ? "warning"
                        : "success"
                  }
                >
                  {getSaleStatusLabel(sale.status)}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailPanel({
  saleDetail,
  loading,
  errorMessage,
  onRetry,
}: {
  saleDetail: SaleDetailResponse | null;
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
    return <LoadingState message="Cargando detalle..." />;
  }

  if (!saleDetail) {
    return (
      <EmptyState
        title="Selecciona una venta"
        description="Elige una venta para revisar su detalle."
      />
    );
  }

  return <SaleTicketCard sale={saleDetail} />;
}

function CompactMetric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/80 bg-white/78 p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 font-semibold tracking-tight ${
          emphasized ? "text-2xl" : "text-base"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PreparationStep({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/74 p-4 shadow-[0_10px_22px_rgba(23,23,23,0.04)]">
      <p className="font-semibold tracking-tight">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
