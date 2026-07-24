"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../stores/cart-store";
import styles from "./page.module.css";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalCalories,
    getAverageHealthScore,
  } = useCartStore();
  const totalPrice = getTotalPrice();
  const totalCalories = getTotalCalories();
  const avgHealthScore = getAverageHealthScore();

  if (items.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span className={styles.cartIcon}>🛒</span>
              <h1>Your Shopping Cart</h1>
            </div>
            <Link href="/restaurants" className={styles.closeBtn} aria-label="Back to restaurants">✕</Link>
          </div>
          <div className={styles.emptyCart}>
            <p className={styles.emptyIcon}>🛍️</p>
            <p className={styles.emptyText}>Your cart is empty</p>
            <p className={styles.emptySubtext}>Add some delicious items to get started!</p>
            <Link href="/restaurants" className={styles.browseBtn}>Browse Restaurants</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <span className={styles.cartIcon}>🛒</span>
            <h1>Your Shopping Cart</h1>
            <span className={styles.itemBadge}>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </div>
          <Link
            href={`/restaurants/${items[0].menuItem.restaurantId}`}
            className={styles.closeBtn}
            aria-label="Back to restaurant"
          >
            ✕
          </Link>
        </div>

        {/* Items list */}
        <div className={styles.itemsList}>
          {items.map((cartItem) => (
            <div key={cartItem.menuItem.id} className={styles.itemCard}>
              {/* Image placeholder */}
              <div className={styles.itemImage}>
                <span className={styles.itemImagePlaceholder}>🍽️</span>
              </div>

              {/* Name + price + controls */}
              <div className={styles.itemBody}>
                <div className={styles.itemTopRow}>
                  <span className={styles.itemName}>{cartItem.menuItem.name}</span>
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
                    Rs. {cartItem.menuItem.priceRs.toFixed(2)}
                  </span>
                  <div className={styles.qtyControls}>
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
                    <span className={styles.qtyValue}>{cartItem.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
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

        {/* Nutrition info strip */}
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
            <span className={styles.subtotalLabel}>Subtotal:</span>
            <span className={styles.subtotalValue}>Rs. {totalPrice.toFixed(2)}</span>
          </div>
          <p className={styles.taxNote}>Shipping &amp; taxes calculated at checkout</p>

          <button
            className={styles.checkoutBtn}
            onClick={() => router.push("/checkout")}
          >
            Proceed to Checkout
          </button>

          <Link href={`/restaurants/${items[0].menuItem.restaurantId}`} className={styles.continueBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
