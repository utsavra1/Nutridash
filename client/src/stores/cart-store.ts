import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MenuItem } from "../types";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  healthScore?: number | null;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: MenuItem, healthScore?: number | null) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalCalories: () => number;
  getAverageHealthScore: () => number | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (menuItem, healthScore) =>
        set((state) => {
          // If adding item from different restaurant, clear cart first
          if (state.restaurantId && state.restaurantId !== menuItem.restaurantId) {
            return {
              items: [{ menuItem, quantity: 1, healthScore }],
              restaurantId: menuItem.restaurantId,
              isOpen: true,
            };
          }

          const existingItem = state.items.find(
            (item) => item.menuItem.id === menuItem.id
          );

          if (existingItem) {
            return {
              isOpen: true,
              items: state.items.map((item) =>
                item.menuItem.id === menuItem.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { menuItem, quantity: 1, healthScore }],
            restaurantId: menuItem.restaurantId,
            isOpen: true,
          };
        }),

      removeItem: (menuItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.menuItem.id !== menuItemId),
        })),

      updateQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItem.id === menuItemId ? { ...item, quantity } : item
          ),
        })),

      clearCart: () => set({ items: [], restaurantId: null, isOpen: false }),

      getTotalPrice: () => {
        const state = get();
        return state.items.reduce(
          (sum, item) => sum + item.menuItem.priceRs * item.quantity,
          0
        );
      },

      getTotalCalories: () => {
        const state = get();
        return state.items.reduce((sum, item) => {
          const calories = item.menuItem.nutrition?.calories || 0;
          return sum + calories * item.quantity;
        }, 0);
      },

      getAverageHealthScore: () => {
        const state = get();
        const itemsWithScore = state.items.filter(
          (item) => item.healthScore !== undefined && item.healthScore !== null
        );
        if (itemsWithScore.length === 0) return null;
        const total = itemsWithScore.reduce(
          (sum, item) => sum + (item.healthScore || 0),
          0
        );
        return Math.round(total / itemsWithScore.length);
      },
    }),
    {
      name: "nutridash-cart-storage",
      // Don't persist drawer open state — always start closed
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
      }),
    }
  )
);
