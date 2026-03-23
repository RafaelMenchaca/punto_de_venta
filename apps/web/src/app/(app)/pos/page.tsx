"use client";

import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaymentPanel } from "@/components/pos/payment-panel";
import { PosCart } from "@/components/pos/pos-cart";
import { ProductSearch } from "@/components/pos/product-search";
import {
  calculateCartTotals,
  SaleSummary,
} from "@/components/pos/sale-summary";
import { useOpenCashSessionQuery } from "@/features/cash/hooks";
import { useCreateSaleMutation } from "@/features/sales/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";
import { useHydratedStore } from "@/hooks/use-hydrated-store";
import { useCartStore } from "@/stores/cart-store";

export default function PosPage() {
  const hydrated = useHydratedStore();
  const { business_id, branch_id, register_id } = useCurrentBusiness();
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
          onSelect={(product) => {
            addItem(product);
            toast.success(`${product.name} agregado al carrito.`);
          }}
        />
        <PosCart
          items={items}
          onQuantityChange={updateQuantity}
          onRemove={removeItem}
        />
      </div>

      <div className="space-y-6">
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
              toast.error("Agrega al menos un producto al carrito.");
              return;
            }

            try {
              await createSaleMutation.mutateAsync({
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
              clearCart();
              toast.success("Venta registrada correctamente.");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "No fue posible registrar la venta.",
              );
            }
          }}
        />
      </div>
    </div>
  );
}
