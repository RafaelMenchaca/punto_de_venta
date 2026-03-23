"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductSearchResult } from "@/features/products/types";
import type { PaymentMethod, SaleCartItem } from "@/features/sales/types";

interface CartState {
  items: SaleCartItem[];
  payment_method: PaymentMethod;
  notes: string;
  addItem: (product: ProductSearchResult) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setPaymentMethod: (paymentMethod: PaymentMethod) => void;
  setNotes: (notes: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      payment_method: "cash",
      notes: "",
      addItem: (product) =>
        set((state) => {
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
              },
            ],
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product_id === productId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        })),
      clearCart: () =>
        set({
          items: [],
          notes: "",
          payment_method: "cash",
        }),
      setPaymentMethod: (payment_method) => set({ payment_method }),
      setNotes: (notes) => set({ notes }),
    }),
    {
      name: "pos-cart",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        items: state.items,
        payment_method: state.payment_method,
        notes: state.notes,
      }),
    },
  ),
);
