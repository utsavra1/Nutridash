"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "../stores/cart-store";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalCalories,
    getAverageHealthScore,
  } = useCartStore();

  const totalPrice = getTotalPrice();
  const totalCalories = getTotalCalories();
  const avgHealthScore = getAverageHealthScore();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.cartIcon}>🛒</span>
            <h2 className={styles.title}>Your Cart</h2>
            {totalItems > 0 && (
              <span className={styles.badge}>{totalItems}</span>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={closeCart}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🛍️</span>
            <p className={styles.emptyTitle}>Your cart is empty</p>
            <p className={styles.emptySubtitle}>
              Add items from the menu to get started!
            </p>
          </div>
        ) : (
          <>
            <div className={styles.itemsList}>
              {items.map((cartItem) => (
                <div key={cartItem.menuItem.id} className={styles.item}>
                  <div className={styles.itemImg}>🍽️</div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTopRow}>
                      <span className={styles.itemName}>
                        {cartItem.menuItem.name}
                      </span>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => removeItem(cartItem.menuItem.id)}
                        aria-label={`Remove ${cartItem.menuItem.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className={styles.itemBottomRow}>
                      <span className={styles.itemPrice}>
                        Rs. {(cartItem.menuItem.priceRs * cartItem.quantity).toFixed(2)}
                      </span>
                      <div className={styles.qty}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => {
                            if (cartItem.quantity > 1) {
                              updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1);
                            } else {
                              removeItem(cartItem.menuItem.id);
                            }
                          }}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className={styles.qtyVal}>{cartItem.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() =>
                            updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nutrition strip */}
            <div className={styles.nutritionStrip}>
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionLabel}>Calories</span>
                <span className={styles.nutritionValue}>{totalCalories} kcal</span>
              </div>
              {avgHealthScore !== null && (
                <div className={styles.nutritionItem}>
                  <span className={styles.nutritionLabel}>Health Score</span>
                  <span className={styles.nutritionValue}>{avgHealthScore}/100</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <div className={styles.subtotalRow}>
                <span className={styles.subtotalLabel}>Subtotal</span>
                <span className={styles.subtotalValue}>
                  Rs. {totalPrice.toFixed(2)}
                </span>
              </div>
              <p className={styles.taxNote}>
                Shipping &amp; taxes calculated at checkout
              </p>
              <button
                className={styles.checkoutBtn}
                onClick={() => {
                  closeCart();
                  router.push("/checkout");
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
