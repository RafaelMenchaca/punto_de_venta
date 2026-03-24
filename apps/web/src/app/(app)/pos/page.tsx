"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PaymentPanel } from "@/components/pos/payment-panel";
import { PosCart } from "@/components/pos/pos-cart";
import { ProductSearch } from "@/components/pos/product-search";
import {
  calculateCartTotals,
  SaleSummary,
} from "@/components/pos/sale-summary";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenCashSessionQuery } from "@/features/cash/hooks";
import { useCreateSaleMutation } from "@/features/sales/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

interface LastSaleState {
  saleId: string;
  total: number;
  paymentMethod: string;
}

export default function PosPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const [saleError, setSaleError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<LastSaleState | null>(null);
  const openSessionQuery = useOpenCashSessionQuery(
    register_id,
    business_id,
    branch_id,
  );
  const createSaleMutation = useCreateSaleMutation(
    register_id,
    business_id,
    branch_id,
  );
  const items = useCartStore((state) => state.items);
  const notes = useCartStore((state) => state.notes);
  const payment_method = useCartStore((state) => state.payment_method);
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const setNotes = useCartStore((state) => state.setNotes);
  const setPaymentMethod = useCartStore((state) => state.setPaymentMethod);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totals = calculateCartTotals(items);

  if (!hydrated) {
    return <LoadingState message="Inicializando POS..." />;
  }

  if (!business_id || !branch_id || !register_id) {
    return (
      <ErrorState message="Falta contexto operativo. Configura negocio, sucursal y caja en variables de desarrollo." />
    );
  }

  if (openSessionQuery.isLoading) {
    return <LoadingState message="Consultando sesión de caja..." />;
  }

  if (openSessionQuery.error instanceof Error) {
    return (
      <ErrorState
        message={openSessionQuery.error.message}
        actionLabel="Reintentar"
        onAction={() => void openSessionQuery.refetch()}
      />
    );
  }

  const openSession = openSessionQuery.data;

  if (!openSession) {
    return (
      <ErrorState message="No hay una caja abierta para esta caja. Abre sesión antes de vender." />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <ProductSearch
          business_id={business_id}
          branch_id={branch_id}
          disableOutOfStock
          onSelect={(product) => {
            setSaleError(null);
            addItem(product);
            toast.success(`${product.name} agregado al carrito.`);
          }}
        />
        <PosCart
          items={items}
          onQuantityChange={(productId, quantity) => {
            setSaleError(null);
            updateQuantity(productId, quantity);
          }}
          onRemove={(productId) => {
            setSaleError(null);
            removeItem(productId);
          }}
        />
      </div>

      <div className="space-y-6">
        {saleError ? <ErrorState message={saleError} /> : null}
        {lastSale ? (
          <Card>
            <CardHeader>
              <CardTitle>Última venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>ID: {lastSale.saleId.slice(0, 8)}</p>
              <p>Total: {formatCurrency(lastSale.total)}</p>
              <p>Método: {lastSale.paymentMethod}</p>
            </CardContent>
          </Card>
        ) : null}
        <SaleSummary items={items} />
        <PaymentPanel
          payment_method={payment_method}
          notes={notes}
          total={totals.total}
          loading={createSaleMutation.isPending}
          onPaymentMethodChange={setPaymentMethod}
          onNotesChange={setNotes}
          onSubmit={async () => {
            if (items.length === 0) {
              const message = "Agrega al menos un producto al carrito.";
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
                notes,
                items: items.map((item) => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                })),
                payments: [
                  {
                    payment_method,
                    amount: totals.total,
                  },
                ],
              });
              setSaleError(null);
              setLastSale({
                saleId: response.sale.id,
                total: response.sale.total,
                paymentMethod: payment_method,
              });
              clearCart();
              toast.success("Venta registrada correctamente.");
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "No fue posible registrar la venta.";
              setSaleError(message);
              toast.error(message);
            }
          }}
        />
      </div>
    </div>
  );
}
