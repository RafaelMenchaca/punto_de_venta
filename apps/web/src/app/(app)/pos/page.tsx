"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CustomerSelector } from "@/components/pos/customer-selector";
import { PaymentPanel } from "@/components/pos/payment-panel";
import { PosCart } from "@/components/pos/pos-cart";
import { ProductSearch } from "@/components/pos/product-search";
import { RefundForm } from "@/components/pos/refund-form";
import { SaleSummary } from "@/components/pos/sale-summary";
import { SaleTicketCard } from "@/components/pos/sale-ticket-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { NoticeBanner } from "@/components/shared/notice-banner";
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
  const setSelectedCustomer = useCartStore((state) => state.setSelectedCustomer);
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
  const replacePaymentLines = useCartStore((state) => state.replacePaymentLines);
  const setNotes = useCartStore((state) => state.setNotes);

  const totals = calculateCartTotals(items, saleDiscount, paymentLines);
  const paymentHelperMessage =
    totals.hasUnsupportedChange
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

  if (!hydrated) {
    return <LoadingState message="Inicializando POS..." />;
  }

  if (!business_id || !branch_id || !register_id) {
    return (
      <ErrorState message="Falta contexto operativo. Configura negocio, sucursal y caja para vender." />
    );
  }

  const openSession = openSessionQuery.data ?? null;
  const saleTabDisabledMessage =
    openSessionQuery.isLoading && !openSession
      ? null
      : openSessionQuery.error instanceof Error
      ? getFriendlyErrorMessage(
          openSessionQuery.error,
          "No se pudo cargar la sesion de caja en este momento.",
        )
      : !openSession
        ? "Debes abrir caja antes de vender."
        : null;

  const posTabs: Array<{ id: PosTab; label: string }> = [
    { id: "sale", label: "Venta" },
    { id: "history", label: "Historial" },
    { id: "refunds", label: "Devoluciones" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operacion actual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-4">
          <MetricCard
            label="Cajero"
            value={contextQuery.data?.user.full_name ?? "Resolviendo usuario..."}
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
            label="Caja abierta"
            value={
              openSession
                ? `Sesion ${new Date(openSession.openedAt).toLocaleTimeString("es-MX")}`
                : "Pendiente"
            }
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-white/70 p-2">
        {posTabs.map((tab) => (
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

      {activeTab === "sale" ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {saleTabDisabledMessage ? (
              <NoticeBanner message={saleTabDisabledMessage} />
            ) : null}

            <CustomerSelector
              businessId={business_id}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              onClearCustomer={() => setSelectedCustomer(null)}
            />

            {openSessionQuery.isLoading && !openSession ? (
              <LoadingState message="Consultando sesion de caja..." />
            ) : null}

            {!saleTabDisabledMessage && !openSessionQuery.isLoading ? (
              <>
                <ProductSearch
                  business_id={business_id}
                  branch_id={branch_id}
                  disableOutOfStock
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
                  items={items}
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
              </>
            ) : null}
          </div>

          <div className="space-y-6">
            {saleError ? <ErrorState message={saleError} /> : null}

            {lastSale ? (
              <SaleTicketCard
                sale={lastSale}
                title="Ultima venta"
                description="Resumen del ultimo ticket registrado."
              />
            ) : null}

            <SaleSummary
              items={items}
              saleDiscount={saleDiscount}
              payments={paymentLines}
              onSaleDiscountChange={setSaleDiscount}
            />

            <PaymentPanel
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
        </div>
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
                      "Se cancelara la venta seleccionada y el stock regresara. ¿Deseas continuar?",
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
                {cancelSaleMutation.isPending ? "Cancelando..." : "Cancelar venta"}
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/60 p-4">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
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
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Buscar folio, cliente o fecha"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
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
                  : "border-border bg-white/70"
              }`}
              onClick={() => onSelectSale(sale.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{sale.folio}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sale.customerName ?? "Publico general"}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(sale.netTotal)}</p>
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
                <Badge>{sale.paymentSummary.label}</Badge>
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
