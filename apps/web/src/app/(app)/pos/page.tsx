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
import { useOperatingContext } from "@/features/context/hooks";
import { useCreateSaleMutation } from "@/features/sales/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

interface LastSaleState {
  total: number;
  paymentMethod: string;
  soldAt: string;
}

export default function PosPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
  const contextQuery = useOperatingContext(business_id, branch_id, register_id);
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
      <ErrorState message="Falta contexto operativo. Configura negocio, sucursal y caja para vender." />
    );
  }

  if (openSessionQuery.isLoading) {
    return <LoadingState message="Consultando sesion de caja..." />;
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
      <ErrorState message="Debes abrir caja antes de vender." />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Operacion actual</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white/60 p-4">
              <p className="text-muted-foreground">Cajero</p>
              <p className="mt-2 font-semibold">
                {contextQuery.data?.user.full_name ?? "Resolviendo usuario..."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/60 p-4">
              <p className="text-muted-foreground">Caja</p>
              <p className="mt-2 font-semibold">
                {contextQuery.data?.register?.name ?? "Caja activa"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/60 p-4">
              <p className="text-muted-foreground">Sucursal</p>
              <p className="mt-2 font-semibold">
                {contextQuery.data?.branch?.name ?? "Sucursal actual"}
              </p>
            </div>
          </CardContent>
        </Card>

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
            const currentItem = items.find((item) => item.product_id === productId);

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
              <CardTitle>Ultima venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Total: {formatCurrency(lastSale.total)}</p>
              <p>Metodo: {lastSale.paymentMethod}</p>
              <p>
                Registrada: {new Date(lastSale.soldAt).toLocaleString("es-MX")}
              </p>
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
                total: response.sale.total,
                paymentMethod: payment_method,
                soldAt: response.sale.created_at,
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
