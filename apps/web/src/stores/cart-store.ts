"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductSearchResult } from "@/features/products/types";
import type {
  RealPaymentMethod,
  SaleCartItem,
  SaleCustomer,
  SalePaymentInput,
} from "@/features/sales/types";

const createPaymentLine = (): SalePaymentInput => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `payment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  payment_method: "cash",
  amount: 0,
  reference: "",
});

interface CartState {
  items: SaleCartItem[];
  selected_customer: SaleCustomer | null;
  sale_discount: number;
  payment_lines: SalePaymentInput[];
  notes: string;
  addItem: (product: ProductSearchResult) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateLineDiscount: (productId: string, discount: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: SaleCustomer | null) => void;
  setSaleDiscount: (discount: number) => void;
  addPaymentLine: () => void;
  removePaymentLine: (paymentLineId: string) => void;
  updatePaymentLineMethod: (
    paymentLineId: string,
    paymentMethod: RealPaymentMethod,
  ) => void;
  updatePaymentLineAmount: (paymentLineId: string, amount: number) => void;
  updatePaymentLineReference: (
    paymentLineId: string,
    reference: string,
  ) => void;
  replacePaymentLines: (paymentLines: SalePaymentInput[]) => void;
  setNotes: (notes: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      selected_customer: null,
      sale_discount: 0,
      payment_lines: [createPaymentLine()],
      notes: "",
      addItem: (product) =>
        set((state) => {
          if (product.trackInventory && product.availableStock <= 0) {
            return state;
          }

          const currentItem = state.items.find(
            (item) => item.product_id === product.id,
          );

          if (currentItem) {
            return {
              items: state.items.map((item) =>
                item.product_id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product_id: product.id,
                product_name: product.name,
                sku: product.sku,
                quantity: 1,
                unit_price: product.unitPrice,
                tax_rate: product.taxRate,
                track_inventory: product.trackInventory,
                available_stock: product.availableStock,
                line_discount: 0,
              },
            ],
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product_id === productId
                ? {
                    ...item,
                    quantity: Number.isFinite(quantity)
                      ? Math.max(1, quantity)
                      : item.quantity,
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      updateLineDiscount: (productId, discount) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId
              ? {
                  ...item,
                  line_discount: Number.isFinite(discount)
                    ? Math.max(0, discount)
                    : item.line_discount,
                }
              : item,
          ),
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        })),
      clearCart: () =>
        set({
          items: [],
          selected_customer: null,
          sale_discount: 0,
          payment_lines: [createPaymentLine()],
          notes: "",
        }),
      setSelectedCustomer: (selected_customer) => set({ selected_customer }),
      setSaleDiscount: (sale_discount) =>
        set({
          sale_discount: Number.isFinite(sale_discount)
            ? Math.max(0, sale_discount)
            : 0,
        }),
      addPaymentLine: () =>
        set((state) => ({
          payment_lines: [...state.payment_lines, createPaymentLine()],
        })),
      removePaymentLine: (paymentLineId) =>
        set((state) => ({
          payment_lines:
            state.payment_lines.length <= 1
              ? state.payment_lines
              : state.payment_lines.filter(
                  (payment) => payment.id !== paymentLineId,
                ),
        })),
      updatePaymentLineMethod: (paymentLineId, paymentMethod) =>
        set((state) => ({
          payment_lines: state.payment_lines.map((payment) =>
            payment.id === paymentLineId
              ? { ...payment, payment_method: paymentMethod }
              : payment,
          ),
        })),
      updatePaymentLineAmount: (paymentLineId, amount) =>
        set((state) => ({
          payment_lines: state.payment_lines.map((payment) =>
            payment.id === paymentLineId
              ? {
                  ...payment,
                  amount: Number.isFinite(amount)
                    ? Math.max(0, amount)
                    : payment.amount,
                }
              : payment,
          ),
        })),
      updatePaymentLineReference: (paymentLineId, reference) =>
        set((state) => ({
          payment_lines: state.payment_lines.map((payment) =>
            payment.id === paymentLineId ? { ...payment, reference } : payment,
          ),
        })),
      replacePaymentLines: (payment_lines) =>
        set({
          payment_lines:
            payment_lines.length > 0 ? payment_lines : [createPaymentLine()],
        }),
      setNotes: (notes) => set({ notes }),
    }),
    {
      name: "pos-cart",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        items: state.items,
        selected_customer: state.selected_customer,
        sale_discount: state.sale_discount,
        payment_lines: state.payment_lines,
        notes: state.notes,
      }),
    },
  ),
);
